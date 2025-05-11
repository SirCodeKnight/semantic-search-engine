from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user", "assistant", or "system"
    content: str
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "role": "user",
                "content": "What is semantic search?",
                "created_at": "2023-09-10T14:30:00"
            }
        }

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "title": "Conversation about semantic search",
                "messages": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "role": "user",
                        "content": "What is semantic search?",
                        "created_at": "2023-09-10T14:30:00"
                    },
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440002",
                        "role": "assistant",
                        "content": "Semantic search is a search technique that understands the context and intent of a query rather than just matching keywords.",
                        "created_at": "2023-09-10T14:30:05"
                    }
                ],
                "created_at": "2023-09-10T14:30:00",
                "updated_at": "2023-09-10T14:30:05"
            }
        }

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    context_window: int = Field(default=5)
    
    class Config:
        schema_extra = {
            "example": {
                "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
                "message": "What is semantic search?",
                "context_window": 5
            }
        }

class ChatResponse(BaseModel):
    conversation_id: str
    message: Message
    sources: List[Dict[str, Any]] = []
    
    class Config:
        schema_extra = {
            "example": {
                "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
                "message": {
                    "id": "550e8400-e29b-41d4-a716-446655440002",
                    "role": "assistant",
                    "content": "Semantic search is a search technique that understands the context and intent of a query rather than just matching keywords.",
                    "created_at": "2023-09-10T14:30:05"
                },
                "sources": [
                    {
                        "document_id": "550e8400-e29b-41d4-a716-446655440003",
                        "chunk_id": "550e8400-e29b-41d4-a716-446655440004",
                        "title": "Introduction to Semantic Search",
                        "content_snippet": "Semantic search systems aim to understand the meaning behind queries...",
                        "score": 0.92
                    }
                ]
            }
        }