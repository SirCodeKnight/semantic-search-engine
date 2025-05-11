from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import random

# Models
class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    processed: bool = True
    chunk_count: int = Field(default=5)

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

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str
    search_time: float

class SearchQuery(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: int = 10
    offset: int = 0
    min_score: float = 0.0
    include_content: bool = True

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.now)

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    context_window: int = 5

class ChatResponse(BaseModel):
    conversation_id: str
    message: Message
    sources: List[Dict[str, Any]] = []

# Create FastAPI app
app = FastAPI(title="Semantic Search Engine Demo")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample data
sample_documents = [
    {
        "id": "1",
        "title": "Introduction to Semantic Search",
        "content": "Semantic search refers to search algorithms that consider the intent and contextual meaning of the search terms, rather than just matching keywords. This approach improves search accuracy and relevance by understanding the semantics of the query.",
        "url": "https://example.com/semantic-search",
        "tags": ["search", "nlp", "semantics"],
        "metadata": {"author": "John Doe", "published_date": "2023-01-15"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "processed": True,
        "chunk_count": 3
    },
    {
        "id": "2",
        "title": "Vector Embeddings for NLP",
        "content": "Vector embeddings represent words or documents as vectors in a high-dimensional space. These vectors capture semantic relationships, allowing similar items to be close to each other in the vector space. This is the foundation of modern semantic search systems.",
        "url": "https://example.com/vector-embeddings",
        "tags": ["vectors", "embeddings", "nlp"],
        "metadata": {"author": "Jane Smith", "published_date": "2023-02-20"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "processed": True,
        "chunk_count": 4
    },
    {
        "id": "3",
        "title": "BERT: Bidirectional Encoder Representations from Transformers",
        "content": "BERT is a transformer-based machine learning technique for natural language processing pre-training developed by Google. It revolutionized NLP by producing context-aware embeddings, unlike previous models that created static embeddings regardless of context.",
        "url": "https://example.com/bert",
        "tags": ["bert", "transformers", "nlp"],
        "metadata": {"author": "Google Research", "published_date": "2023-03-10"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "processed": True,
        "chunk_count": 5
    },
    {
        "id": "4",
        "title": "Building a Search Engine with Python",
        "content": "This tutorial shows how to build a basic search engine using Python. We'll cover indexing documents, query processing, and ranking results. We'll also discuss how to implement both keyword-based and semantic search capabilities.",
        "url": "https://example.com/python-search",
        "tags": ["python", "search", "tutorial"],
        "metadata": {"author": "Python Developer", "published_date": "2023-04-05"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "processed": True,
        "chunk_count": 2
    },
    {
        "id": "5",
        "title": "The Future of Search Technology",
        "content": "As AI continues to advance, search technology is evolving rapidly. Future search engines will better understand human language, context, and intent. Multimodal search combining text, images, and voice will become standard. Personalization will also improve, delivering highly relevant results for each user.",
        "url": "https://example.com/future-search",
        "tags": ["ai", "future", "technology"],
        "metadata": {"author": "Tech Analyst", "published_date": "2023-05-01"},
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "processed": True,
        "chunk_count": 3
    }
]

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/documents", response_model=List[Document])
async def get_documents(skip: int = 0, limit: int = 100, tag: Optional[str] = None):
    """Get all documents"""
    # In a real implementation, we would query the database
    # For demo, we'll return sample data
    filtered_docs = []
    for doc in sample_documents:
        if tag is None or tag in doc["tags"]:
            filtered_docs.append(doc)
    
    return filtered_docs[skip:skip+limit]

@app.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str):
    """Get a document by ID"""
    for doc in sample_documents:
        if doc["id"] == document_id:
            return doc
    
    raise HTTPException(status_code=404, detail="Document not found")

@app.post("/search", response_model=SearchResponse)
async def search_documents(query: SearchQuery):
    """Search documents using semantic search"""
    start_time = time.time()
    
    # Simulated search (in a real implementation, we'd use vector similarity search)
    results = []
    for doc in sample_documents:
        # Simple keyword matching for demo
        query_terms = query.query.lower().split()
        doc_content = doc["content"].lower()
        
        # Calculate a simple score based on term frequency
        score = 0
        for term in query_terms:
            if term in doc_content:
                score += 0.2
            if term in doc["title"].lower():
                score += 0.3
        
        # Apply filters if provided
        if query.filters:
            match = True
            for key, value in query.filters.items():
                if key == "tags":
                    if not set(value).issubset(set(doc["tags"])):
                        match = False
                        break
            if not match:
                continue
        
        # Only include documents with non-zero score
        if score > 0:
            # Generate highlights (simple implementation)
            highlights = []
            for term in query_terms:
                if term in doc_content:
                    start = max(0, doc_content.find(term) - 30)
                    end = min(len(doc_content), doc_content.find(term) + len(term) + 30)
                    highlight = "..." + doc_content[start:end] + "..."
                    highlights.append(highlight)
            
            results.append(SearchResult(
                document_id=doc["id"],
                chunk_id=f"{doc['id']}_chunk_1",  # Demo chunk ID
                title=doc["title"],
                content=doc["content"] if query.include_content else None,
                url=doc["url"],
                score=min(1.0, score),  # Ensure score is no more than 1.0
                metadata=doc["metadata"],
                tags=doc["tags"],
                highlights=highlights[:3],  # Limit to 3 highlights
                created_at=doc["created_at"]
            ))
    
    # Sort by score
    results.sort(key=lambda x: x.score, reverse=True)
    
    # Apply offset and limit
    results = results[query.offset:query.offset + query.limit]
    
    search_time = time.time() - start_time
    
    return SearchResponse(
        results=results,
        total=len(results),
        query=query.query,
        search_time=search_time
    )

@app.post("/search/suggest")
async def suggest_queries(prefix: str, limit: int = 5):
    """Get query suggestions based on prefix"""
    suggestions = []
    
    # Simple suggestions based on document content
    if prefix.lower() in "semantic":
        suggestions.extend(["semantic search", "semantic web", "semantic analysis"])
    elif prefix.lower() in "vector":
        suggestions.extend(["vector embeddings", "vector database", "vector search"])
    elif prefix.lower() in "nlp":
        suggestions.extend(["nlp techniques", "nlp for search", "nlp models"])
    elif prefix.lower() in "search":
        suggestions.extend(["search engine", "search optimization", "search technology"])
    elif prefix.lower() in "bert":
        suggestions.extend(["bert model", "bert embeddings", "bert transformers"])
    
    # Filter by prefix
    suggestions = [s for s in suggestions if s.lower().startswith(prefix.lower())]
    
    # Limit results
    suggestions = suggestions[:limit]
    
    return {"suggestions": suggestions}

@app.get("/chat/conversations", response_model=List[Conversation])
async def get_conversations():
    """Get all conversations"""
    # For demo, return some sample conversations
    return [
        Conversation(
            id="conv1",
            title="Conversation about semantic search",
            messages=[
                Message(
                    id="msg1",
                    role="user",
                    content="What is semantic search?",
                    created_at=datetime.now()
                ),
                Message(
                    id="msg2",
                    role="assistant",
                    content="Semantic search refers to search algorithms that consider the intent and contextual meaning of the search terms, rather than just matching keywords. This approach improves search accuracy and relevance by understanding the semantics of the query.",
                    created_at=datetime.now()
                )
            ],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    ]

@app.post("/chat", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    """Chat with the system"""
    # Create user message
    user_message = Message(
        role="user",
        content=request.message,
        created_at=datetime.now()
    )
    
    # Find relevant documents
    relevant_docs = []
    for doc in sample_documents:
        for term in request.message.lower().split():
            if term in doc["content"].lower() or term in doc["title"].lower():
                relevant_docs.append(doc)
                break
    
    # Prepare sources
    sources = []
    for doc in relevant_docs[:3]:  # Limit to 3 sources
        sources.append({
            "document_id": doc["id"],
            "chunk_id": f"{doc['id']}_chunk_1",
            "title": doc["title"],
            "content_snippet": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"],
            "score": random.uniform(0.7, 0.95)  # Random score for demo
        })
    
    # Generate response
    response_content = ""
    if "semantic search" in request.message.lower():
        response_content = "Semantic search refers to search algorithms that consider the intent and contextual meaning of the search terms, rather than just matching keywords. This approach improves search accuracy and relevance by understanding the semantics of the query."
    elif "vector embedding" in request.message.lower():
        response_content = "Vector embeddings represent words or documents as vectors in a high-dimensional space. These vectors capture semantic relationships, allowing similar items to be close to each other in the vector space. This is the foundation of modern semantic search systems."
    elif "bert" in request.message.lower():
        response_content = "BERT is a transformer-based machine learning technique for natural language processing pre-training developed by Google. It revolutionized NLP by producing context-aware embeddings, unlike previous models that created static embeddings regardless of context."
    else:
        response_content = f"Based on your question about '{request.message}', I've found some relevant information in our documents. " + \
            "Semantic search technology uses vector embeddings to represent the meaning of text, allowing for more accurate and relevant search results compared to traditional keyword matching."
    
    # Create assistant message
    assistant_message = Message(
        role="assistant",
        content=response_content,
        created_at=datetime.now()
    )
    
    # Get or create conversation
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    return ChatResponse(
        conversation_id=conversation_id,
        message=assistant_message,
        sources=sources
    )

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)