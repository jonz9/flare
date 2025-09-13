# Flashcard Backend (Flask + Cohere)

## Setup

1. Create & activate virtual env (optional but recommended).
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and add your `COHERE_API_KEY`.
4. Run: `python run.py`

Health check: `GET http://localhost:5001/api/health`
Generate flashcards (batch): `POST http://localhost:5001/api/flashcards/`
Natural language command: `POST http://localhost:5001/api/flashcards/command`
Streaming generation (SSE): `POST http://localhost:5001/api/flashcards/stream`

```json
{
	"text": "Your study material here ...",
	"count": 10
}
```

Batch response:
Command example:

```json
POST /api/flashcards/command
{
	"command": "generate five flashcards on Laplace transforms"
}
```

Streaming example (SSE):

```bash
curl -N -X POST -H 'Content-Type: application/json' \
	-d '{"text": "Laplace transform converts f(t) into F(s)...", "count": 5}' \
	http://localhost:5001/api/flashcards/stream
```

Each event:

```
data: {"index":0,"question":"...","answer":"..."}

... (repeated)
event: end
data: {}
```

```json
{
	"flashcards": [{ "question": "...", "answer": "..." }],
	"model": "cohere"
}
```

## Notes

-   Input text is truncated to MAX_INPUT_CHARS.
-   Default flashcard count falls back to FLASHCARD_COUNT if not provided.
-   Pydantic validates incoming payload.
-   Cohere SDK versions differ: current code uses chat(message=...) not chat(messages=[...]). Adjust if upgrading to a messages-based API.
