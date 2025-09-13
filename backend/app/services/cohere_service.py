from __future__ import annotations
import cohere
from typing import List, Optional, Generator
from ..config import Config
from ..models.flashcards import Flashcard, Intent

SYSTEM_PROMPT = """You are an assistant that extracts the most important study flashcards from provided material. \
Return concise, student-friendly Q&A pairs. Avoid trivial facts; focus on concepts, cause-effect, definitions, and processes.\n"""

FLASHCARD_FORMAT_INSTRUCTIONS = """Return JSON with a top-level list named flashcards, each item having 'question' and 'answer'.\nExample:\n{\n  \"flashcards\": [\n    {\"question\": \"What is X?\", \"answer\": \"X is ...\"}\n  ]\n}\nOnly return JSON."""

INTENT_EXTRACTION_PROMPT = """You classify a user's command for a study flashcard AR app. Output STRICT JSON with fields: intent (one of generate, adjust_difficulty, request_analogy, review_feedback, unknown); topic (string or null); count (int or null); difficulty_delta (int or null); difficulty (int or null); feedback (easy|hard|null); analogy_target (string or null). Keep nulls for unused. User command: """


class CohereFlashcardGenerator:
    def __init__(self, api_key: str | None = None):
        key = api_key or Config.COHERE_API_KEY
        if not key:
            raise ValueError("Cohere API key missing. Set COHERE_API_KEY in environment.")
        self.client = cohere.Client(api_key=key)

    def generate(self, text: str, count: int) -> List[Flashcard]:
        # Basic guardrails
        sanitized = text.strip()
        if len(sanitized) > Config.MAX_INPUT_CHARS:
            sanitized = sanitized[: Config.MAX_INPUT_CHARS]

        prompt = (
            f"{SYSTEM_PROMPT}\nMaterial:\n" + sanitized + "\n\nGenerate "
            f"{count} high-quality flashcards.\n{FLASHCARD_FORMAT_INSTRUCTIONS}"
        )

        response = self.client.chat(
            model="command-r-plus",  # adjust model name as needed
            message=prompt,
            temperature=0.4,
            max_tokens=800,
        )

        # Cohere Python SDK chat response structure access
        text_resp = response.text if hasattr(response, "text") else str(response)

        import json
        try:
            data = json.loads(text_resp)
        except json.JSONDecodeError:
            # Attempt to extract JSON substring
            import re
            match = re.search(r"\{.*\}\s*$", text_resp, re.DOTALL)
            if not match:
                raise ValueError("Model response did not contain valid JSON")
            data = json.loads(match.group(0))

        cards_raw = data.get("flashcards") or []
        flashcards: List[Flashcard] = []
        for item in cards_raw:
            q = (item.get("question") or "").strip()
            a = (item.get("answer") or "").strip()
            if q and a:
                flashcards.append(Flashcard(question=q, answer=a))
        return flashcards

    # Streaming generator (yields Flashcard as soon as parsed) using Chat streaming API
    def stream_generate(self, text: str, count: int) -> Generator[Flashcard, None, None]:
        sanitized = text.strip()
        if len(sanitized) > Config.MAX_INPUT_CHARS:
            sanitized = sanitized[: Config.MAX_INPUT_CHARS]
        prompt = (
            f"{SYSTEM_PROMPT}\nMaterial:\n" + sanitized + "\n\nGenerate "
            f"{count} high-quality flashcards.\n{FLASHCARD_FORMAT_INSTRUCTIONS}"
        )
        # NOTE: Cohere SDK streaming interface may differ; adapt if needed
        stream = self.client.chat_stream(
            model="command-r-plus",
            message=prompt,
            temperature=0.4,
            max_tokens=800,
        )
        import json, re
        buffer = ""
        for event in stream:
            # Each event may have 'text'
            chunk = getattr(event, "text", None)
            if not chunk:
                continue
            buffer += chunk
            # Attempt incremental extraction of complete flashcards
            # Look for objects {"question":...,"answer":...}
            for match in re.finditer(r"\{\s*\"question\"\s*:\s*\"(.*?)\"\s*,\s*\"answer\"\s*:\s*\"(.*?)\"\s*\}", buffer, re.DOTALL):
                q, a = match.group(1), match.group(2)
                yield Flashcard(question=q.strip(), answer=a.strip())
            # If buffer grows large, trim retained end to avoid perf issues
            if len(buffer) > 20000:
                buffer = buffer[-10000:]

    def parse_intent(self, command: str) -> Intent:
        prompt = INTENT_EXTRACTION_PROMPT + command.strip()
        response = self.client.chat(
            model="command-r-plus",
            message=prompt,
            temperature=0.1,
            max_tokens=200,
        )
        import json, re
        text_resp = response.text if hasattr(response, "text") else str(response)
        try:
            data = json.loads(text_resp)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}\s*$", text_resp, re.DOTALL)
            if not match:
                return Intent(intent="unknown")
            data = json.loads(match.group(0))
        # Coerce/guard
        return Intent(**data)
