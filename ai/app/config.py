from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str
    ai_service_port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
