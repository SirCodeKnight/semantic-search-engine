from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SearchQuery(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = Field(default=None)
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)
    include_content: bool = Field(default=True)
    
    class Config:
        schema_extra = {
            "example": {
                "query": "semantic search with language models",
                "filters": {"tags": ["tutorial"], "metadata.author": "John Doe"},
                "limit": 10,
                "offset": 0,
                "min_score": 0.5,
                "include_content": True
            }
        }

class SearchResult(BaseModel):
    document_id: str
    chunk_id: str
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    score: float
    metadata: Dict[str, Any] = {}
    tags: List[str] = []
    highlights: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "document_id": "550e8400-e29b-41d4-a716-446655440001",
                "chunk_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Sample Document",
                "content": "This is a chunk of text from a document that discusses semantic search with language models.",
                "url": "https://example.com/sample.pdf",
                "score": 0.85,
                "metadata": {"page_number": 1, "section": "Introduction"},
                "tags": ["sample", "tutorial"],
                "highlights": ["semantic search", "language models"],
                "created_at": "2023-09-10T14:30:00"
            }
        }

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str
    search_time: float  # in seconds
    
    class Config:
        schema_extra = {
            "example": {
                "results": [{
                    "document_id": "550e8400-e29b-41d4-a716-446655440001",
                    "chunk_id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "Sample Document",
                    "content": "This is a chunk of text from a document that discusses semantic search with language models.",
                    "url": "https://example.com/sample.pdf",
                    "score": 0.85,
                    "metadata": {"page_number": 1, "section": "Introduction"},
                    "tags": ["sample", "tutorial"],
                    "highlights": ["semantic search", "language models"],
                    "created_at": "2023-09-10T14:30:00"
                }],
                "total": 1,
                "query": "semantic search with language models",
                "search_time": 0.05
            }
        }

class SuggestQuery(BaseModel):
    prefix: str
    limit: int = Field(default=5, ge=1, le=20)
    
    class Config:
        schema_extra = {
            "example": {
                "prefix": "sem",
                "limit": 5
            }
        }

class SuggestResponse(BaseModel):
    suggestions: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "suggestions": ["semantic search", "semantic web", "semantic networks", "semantics in NLP", "semantic similarity"]
            }
        }