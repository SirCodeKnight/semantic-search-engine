from pydantic import BaseSettings, Field
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Server settings
    port: int = Field(default=int(os.getenv("PORT", 8000)))
    host: str = Field(default=os.getenv("HOST", "0.0.0.0"))
    debug: bool = Field(default=os.getenv("DEBUG", "True").lower() == "true")
    allowed_origins: List[str] = Field(
        default=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    )
    
    # API settings
    api_key: str = Field(default=os.getenv("API_KEY", ""))
    api_only_mode: bool = Field(default=os.getenv("API_ONLY_MODE", "False").lower() == "true")
    
    # Database settings
    mongodb_uri: str = Field(default=os.getenv("MONGODB_URI", "mongodb://localhost:27017/semantic_search"))
    
    # Model settings
    model_name: str = Field(default=os.getenv("MODEL_NAME", "all-MiniLM-L6-v2"))
    embedding_dimension: int = Field(default=int(os.getenv("EMBEDDING_DIMENSION", 384)))
    index_type: str = Field(default=os.getenv("INDEX_TYPE", "Flat"))
    
    # OpenAI settings
    openai_api_key: Optional[str] = Field(default=os.getenv("OPENAI_API_KEY", None))
    use_openai_embeddings: bool = Field(default=os.getenv("USE_OPENAI_EMBEDDINGS", "False").lower() == "true")
    openai_embedding_model: str = Field(default=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002"))
    openai_chat_model: str = Field(default=os.getenv("OPENAI_CHAT_MODEL", "gpt-3.5-turbo"))
    
    # Document processing settings
    max_file_size: int = Field(default=int(os.getenv("MAX_FILE_SIZE", 10)))  # In MB
    chunk_size: int = Field(default=int(os.getenv("CHUNK_SIZE", 1000)))
    chunk_overlap: int = Field(default=int(os.getenv("CHUNK_OVERLAP", 200)))
    max_chunks_per_doc: int = Field(default=int(os.getenv("MAX_CHUNKS_PER_DOC", 100)))
    
    class Config:
        env_file = ".env"