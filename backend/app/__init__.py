from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from .routes.flashcards import bp as flashcards_bp
    app.register_blueprint(flashcards_bp, url_prefix="/api/flashcards")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
