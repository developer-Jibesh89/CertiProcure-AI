from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # The field names must match the keys in your .env file
    GOOGLE_API_KEY: str
    
    # Default values can be set here
    PROJECT_NAME: str = "CRPF Tender Auditor"
    API_V1_STR: str = "/api/v1"
    
    # This tells Pydantic to read from the .env file
    model_config = SettingsConfigDict(env_file=".env")

# Create a singleton instance to be used across the app
settings = Settings()