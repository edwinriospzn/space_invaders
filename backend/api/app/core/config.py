import os

from dotenv import load_dotenv

load_dotenv()


class Settings:

    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "Space Invaders Telemetry API")
        self.api_version = os.getenv("API_VERSION", "0.1.0")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"


settings = Settings()
