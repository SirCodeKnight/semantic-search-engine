from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_database, get_vector_store, verify_api_key

router = APIRouter(prefix="/admin", dependencies=[Depends(verify_api_key)])

@router.get("/stats")
async def get_stats(
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store)
):
    """
    Get system statistics
    """
    documents_collection = db.documents
    chunks_collection = db.document_chunks
    
    # Count documents
    document_count = await documents_collection.count_documents({})
    processed_count = await documents_collection.count_documents({"processed": True})
    error_count = await documents_collection.count_documents({"error": {"$ne": None}})
    
    # Count chunks
    chunk_count = await chunks_collection.count_documents({})
    
    # Get vector count from FAISS
    vector_count = vector_store.index.ntotal if vector_store.index else 0
    
    # Get recent documents
    cursor = documents_collection.find({}).sort("created_at", -1).limit(5)
    recent_documents = await cursor.to_list(length=5)
    
    # Count tags
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    cursor = documents_collection.aggregate(pipeline)
    tags = await cursor.to_list(length=10)
    
    return {
        "document_count": document_count,
        "processed_count": processed_count,
        "error_count": error_count,
        "chunk_count": chunk_count,
        "vector_count": vector_count,
        "recent_documents": recent_documents,
        "top_tags": tags
    }

@router.post("/reset")
async def reset_system(
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store)
):
    """
    Reset the entire system (delete all documents, chunks, and vectors)
    """
    # Reset in background
    background_tasks.add_task(reset_system_task, db, vector_store)
    
    return {"status": "reset initiated"}

async def reset_system_task(db, vector_store):
    """Background task to reset the system"""
    # Drop collections
    await db.documents.delete_many({})
    await db.document_chunks.delete_many({})
    await db.search_queries.delete_many({})
    await db.conversations.delete_many({})
    
    # Reset vector store
    await vector_store.reset_index()

@router.post("/reindex")
async def reindex_documents(
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store)
):
    """
    Reindex all documents (regenerate chunks and embeddings)
    """
    # Reset in background
    background_tasks.add_task(reindex_documents_task, db, vector_store)
    
    return {"status": "reindex initiated"}

async def reindex_documents_task(db, vector_store):
    """Background task to reindex all documents"""
    # Reset processed flag for all documents
    await db.documents.update_many(
        {},
        {"$set": {"processed": False, "chunk_count": 0, "error": None}}
    )
    
    # Delete all chunks
    await db.document_chunks.delete_many({})
    
    # Reset vector store
    await vector_store.reset_index()