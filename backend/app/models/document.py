from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class DocumentChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    content: str
    metadata: Dict[str, Any] = {}
    embedding: Optional[List[float]] = None
    chunk_index: int
    
    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "document_id": "550e8400-e29b-41d4-a716-446655440001",
                "content": "This is a chunk of text from a document that will be embedded for semantic search.",
                "metadata": {"page_number": 1, "section": "Introduction"},
                "chunk_index": 0
            }
        }

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    url: Optional[str] = None
    mime_type: Optional[str] = None
    metadata: Dict[str, Any] = {}
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    processed: bool = False
    error: Optional[str] = None
    chunk_count: int = 0
    
    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "title": "Sample Document",
                "content": "This is the full content of the document that will be chunked and embedded.",
                "file_path": "/data/documents/sample.pdf",
                "url": "https://example.com/sample.pdf",
                "mime_type": "application/pdf",
                "metadata": {"author": "John Doe", "published_date": "2023-09-01"},
                "tags": ["sample", "tutorial"],
                "created_at": "2023-09-10T14:30:00",
                "updated_at": "2023-09-10T14:30:00",
                "processed": True,
                "chunk_count": 5
            }
        }

class DocumentCreate(BaseModel):
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Sample Document",
                "content": "This is the content of the document to be added to the search engine.",
                "url": "https://example.com/sample",
                "tags": ["sample", "tutorial"],
                "metadata": {"author": "John Doe", "published_date": "2023-09-01"}
            }
        }

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Updated Document Title",
                "tags": ["updated", "modified"],
                "metadata": {"editor": "Jane Smith", "edited_date": "2023-09-15"}
            }
        }

class DocumentResponse(BaseModel):
    id: str
    title: str
    url: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    processed: bool
    chunk_count: int
    
    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "title": "Sample Document",
                "url": "https://example.com/sample.pdf",
                "tags": ["sample", "tutorial"],
                "metadata": {"author": "John Doe", "published_date": "2023-09-01"},
                "created_at": "2023-09-10T14:30:00",
                "updated_at": "2023-09-10T14:30:00",
                "processed": True,
                "chunk_count": 5
            }
        }