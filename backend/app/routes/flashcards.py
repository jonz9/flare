from flask import Blueprint, request, jsonify, Response, stream_with_context
from pydantic import ValidationError
from ..models.flashcards import (
    FlashcardRequest,
    FlashcardResponse,
    CommandRequest,
    CommandResponse,
)
from ..services.cohere_service import CohereFlashcardGenerator
from ..config import Config

bp = Blueprint("flashcards", __name__)

generator: CohereFlashcardGenerator | None = None

def _get_generator() -> CohereFlashcardGenerator:
    global generator
    if generator is None:
        generator = CohereFlashcardGenerator()
    return generator

@bp.post("/")
def create_flashcards():
    try:
        payload = request.get_json(force=True, silent=False) or {}
        req = FlashcardRequest(**payload)
    except ValidationError as ve:
        return jsonify({"error": "validation_error", "details": ve.errors()}), 400
    except Exception:
        return jsonify({"error": "invalid_json"}), 400

    count = req.count or Config.FLASHCARD_COUNT

    try:
        cards = _get_generator().generate(req.text, count)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "generation_failed", "message": str(e)}), 500

    resp = FlashcardResponse(flashcards=cards, model="cohere")
    return jsonify(resp.model_dump()), 200


@bp.post("/command")
def handle_command():
    try:
        payload = request.get_json(force=True, silent=False) or {}
        cmd_req = CommandRequest(**payload)
    except ValidationError as ve:
        return jsonify({"error": "validation_error", "details": ve.errors()}), 400
    except Exception:
        return jsonify({"error": "invalid_json"}), 400

    gen = _get_generator()
    intent = gen.parse_intent(cmd_req.command)

    flashcards = None
    message = None
    # Handle intents
    if intent.intent == "generate":
        topic_source = intent.topic or cmd_req.command
        flashcards = gen.generate(topic_source, intent.count or Config.FLASHCARD_COUNT)
    elif intent.intent == "adjust_difficulty":
        message = "Difficulty adjustment acknowledged"  # actual adaptation handled client-side or future stateful logic
    elif intent.intent == "request_analogy":
        # Placeholder: ask model for analogy as single flashcard
        analogy_text = f"Provide an analogy for: {intent.topic or cmd_req.command}. Use everyday concepts."
        analogy_card = gen.generate(analogy_text, 1)
        flashcards = analogy_card
    elif intent.intent == "review_feedback":
        message = f"Feedback '{intent.feedback}' recorded"
    else:
        message = "Could not classify command"

    resp = CommandResponse(intent=intent, flashcards=flashcards, message=message, model="cohere")
    return jsonify(resp.model_dump()), 200


@bp.post("/stream")
def stream_flashcards():
    try:
        payload = request.get_json(force=True, silent=False) or {}
        req = FlashcardRequest(**payload)
    except ValidationError as ve:
        return jsonify({"error": "validation_error", "details": ve.errors()}), 400
    except Exception:
        return jsonify({"error": "invalid_json"}), 400

    count = req.count or Config.FLASHCARD_COUNT
    gen = _get_generator()

    def event_stream():
        yielded = 0
        for card in gen.stream_generate(req.text, count):
            yielded += 1
            yield f"data: {{\"index\": {yielded-1}, \"question\": {json_escape(card.question)}, \"answer\": {json_escape(card.answer)}}}\n\n"
        yield "event: end\ndata: {}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")


def json_escape(s: str) -> str:
    import json as _json
    return _json.dumps(s)
