from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any

class Flashcard(BaseModel):
    question: str = Field(..., description="Prompt or question side of the card")
    answer: str = Field(..., description="Answer/back of the card")

class FlashcardRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Source text to convert into flashcards")
    count: int | None = Field(None, ge=1, le=50, description="Desired number of flashcards")

class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]
    model: str | None = None


class CommandRequest(BaseModel):
    command: str = Field(..., min_length=3, description="Natural language user command, e.g. 'generate five flashcards on Laplace transforms'")
    # Optional context from prior conversation / session
    session_id: Optional[str] = Field(None, description="Client session identifier")


class Intent(BaseModel):
    intent: Literal[
        "generate",
        "adjust_difficulty",
        "request_analogy",
        "review_feedback",
        "unknown",
    ]
    topic: Optional[str] = None
    count: Optional[int] = Field(None, ge=1, le=50)
    difficulty_delta: Optional[int] = Field(
        None, description="Positive or negative adjustment to difficulty scale"
    )
    difficulty: Optional[int] = Field(
        None, ge=1, le=5, description="Target difficulty after adjustment (1=basic,5=expert)"
    )
    feedback: Optional[Literal["easy", "hard"]] = None
    analogy_target: Optional[str] = Field(
        None, description="If user asks for an analogy, what everyday concept should be used"
    )


class CommandResponse(BaseModel):
    intent: Intent
    flashcards: Optional[List[Flashcard]] = None
    message: Optional[str] = None
    model: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
