from fastapi import Depends, HTTPException, Header, status
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.settings import Settings
from app.utils.vector_store import VectorStore
from app.utils.embedding_model import EmbeddingModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
settings = Settings()

# Database connection
_db_client = None
_db = None

# Vector store
_vector_store = None

# Embedding model
_embedding_model = None

async def get_database():
    """Get database client"""
    global _db_client, _db
    if _db_client is None:
        _db_client = AsyncIOMotorClient(settings.mongodb_uri)
        _db = _db_client.get_database()
    return _db

async def get_vector_store():
    """Get vector store instance"""
    global _vector_store
    if _vector_store is None:
        # Initialize vector store
        _vector_store = VectorStore(
            dimension=settings.embedding_dimension,
            index_type=settings.index_type
        )
        # Load index if exists
        await _vector_store.load_or_create_index()
    return _vector_store

async def get_embedding_model():
    """Get embedding model instance"""
    global _embedding_model
    if _embedding_model is None:
        # Initialize embedding model
        _embedding_model = EmbeddingModel(
            model_name=settings.model_name,
            use_openai=settings.use_openai_embeddings,
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_embedding_model
        )
    return _embedding_model

async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """Verify API key in header"""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return x_api_key

async def get_settings():
    """Get application settings"""
    return settings