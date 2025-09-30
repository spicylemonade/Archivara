from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator, HttpUrl, Field


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Archivara"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "archivara"
    POSTGRES_PASSWORD: str = "archivara_pass"
    POSTGRES_DB: str = "archivara"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://archivara:password@localhost/archivara"
    )
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=values.get("POSTGRES_DB"),
        )
    
    # Security
    SECRET_KEY: str = Field(default="your-secret-key-here-change-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24 * 7)  # 7 days
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # S3 Storage
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "archivara-artifacts"
    S3_ENDPOINT_URL: Optional[str] = None  # For local MinIO
    
    # Vector Database
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "papers"
    
    # ElasticSearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_INDEX: str = "archivara"
    
    # Authentication
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Auth0
    AUTH0_DOMAIN: str = ""
    AUTH0_CLIENT_ID: str = ""
    AUTH0_CLIENT_SECRET: str = ""
    AUTH0_AUDIENCE: str = ""
    
    # Embeddings
    EMBEDDING_MODEL: str = "intfloat/e5-large-v2"
    EMBEDDING_DIMENSION: int = 1024
    
    # Cohere
    COHERE_API_KEY: Optional[str] = None
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # Anthropic (for MCP)
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Frontend URL (for email verification links)
    FRONTEND_URL: str = "http://localhost:3000"

    # Email Configuration (SMTP - Free)
    SMTP_HOST: str = "smtp.gmail.com"  # Use your email provider
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # Your email address
    SMTP_PASSWORD: str = ""  # App password (not regular password)
    EMAIL_FROM: str = ""  # Your email address
    EMAIL_FROM_NAME: str = "Archivara"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = True
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".zip", ".ipynb", ".yaml", ".json", ".safetensors"]
    
    # Clustering
    MIN_CLUSTER_SIZE: int = 5
    CLUSTER_UPDATE_INTERVAL_DAYS: int = 30
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


settings = Settings() 