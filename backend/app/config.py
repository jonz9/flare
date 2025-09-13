import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
    # Limit tokens or text length to avoid excessive costs
    MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "12000"))
    FLASHCARD_COUNT = int(os.getenv("FLASHCARD_COUNT", "12"))
