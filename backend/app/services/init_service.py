from motor.motor_asyncio import AsyncIOMotorClient
from app.models.settings import Settings
import os
import secrets
from app.utils.vector_store import VectorStore
from app.utils.embedding_model import EmbeddingModel

async def initialize_system():
    """
    Initialize the system on startup
    """
    settings = Settings()
    
    # Create data directories
    os.makedirs("data", exist_ok=True)
    os.makedirs("data/uploads", exist_ok=True)
    
    # Generate API key if not provided
    if not settings.api_key:
        api_key = secrets.token_hex(16)
        print(f"Generated API key: {api_key}")
        # Write to .env file if it exists
        if os.path.exists(".env"):
            with open(".env", "a") as f:
                f.write(f"\nAPI_KEY={api_key}")
    
    # Connect to database
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_database()
    
    # Create collections if they don't exist
    if "documents" not in await db.list_collection_names():
        await db.create_collection("documents")
        
    if "document_chunks" not in await db.list_collection_names():
        await db.create_collection("document_chunks")
        
    if "search_queries" not in await db.list_collection_names():
        await db.create_collection("search_queries")
        
    if "conversations" not in await db.list_collection_names():
        await db.create_collection("conversations")
    
    # Create indexes
    await db.documents.create_index("id", unique=True)
    await db.documents.create_index("tags")
    await db.documents.create_index("created_at")
    
    await db.document_chunks.create_index("id", unique=True)
    await db.document_chunks.create_index("document_id")
    
    await db.search_queries.create_index("query", unique=True)
    await db.search_queries.create_index("count")
    
    await db.conversations.create_index("id", unique=True)
    
    print("Database initialization complete")
    
    # Initialize vector store
    vector_store = VectorStore(
        dimension=settings.embedding_dimension,
        index_type=settings.index_type
    )
    await vector_store.load_or_create_index()
    
    print("Vector store initialization complete")
    
    # Initialize embedding model
    _ = EmbeddingModel(
        model_name=settings.model_name,
        use_openai=settings.use_openai_embeddings,
        openai_api_key=settings.openai_api_key,
        openai_model=settings.openai_embedding_model,
        cache_dir="data/models"
    )
    
    print("Embedding model initialization complete")
    
    # System initialization complete
    print("System initialization complete")