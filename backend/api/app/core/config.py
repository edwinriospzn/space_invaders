import os

from dotenv import load_dotenv

load_dotenv()


class Settings:

    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "Space Invaders Telemetry API")
        self.api_version = os.getenv("API_VERSION", "0.1.0")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://space_invaders:space_invaders@localhost:5432/space_invaders",
        )


settings = Settings()
