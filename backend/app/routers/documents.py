from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import uuid
from datetime import datetime
import json
import shutil
import validators
from app.models.document import Document, DocumentChunk, DocumentCreate, DocumentUpdate, DocumentResponse
from app.dependencies import get_database, get_vector_store, get_embedding_model, verify_api_key, get_settings
from app.utils.document_processor import DocumentProcessor

router = APIRouter(prefix="/documents", dependencies=[Depends(verify_api_key)])

@router.get("", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all documents
    """
    documents_collection = db.documents
    
    # Build query
    query = {}
    if tag:
        query["tags"] = tag
    
    # Execute query
    cursor = documents_collection.find(query).skip(skip).limit(limit)
    documents = await cursor.to_list(length=limit)
    
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a document by ID
    """
    documents_collection = db.documents
    document = await documents_collection.find_one({"id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return document

@router.post("", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store),
    embedding_model = Depends(get_embedding_model),
    settings = Depends(get_settings)
):
    """
    Create a new document
    """
    documents_collection = db.documents
    chunks_collection = db.document_chunks
    
    # Create new document
    new_document = Document(
        title=document.title,
        content=document.content,
        url=document.url,
        tags=document.tags,
        metadata=document.metadata
    )
    
    # Insert document
    await documents_collection.insert_one(new_document.dict())
    
    # Process document in background
    background_tasks.add_task(
        process_document_task,
        new_document,
        db,
        vector_store,
        embedding_model,
        settings
    )
    
    return new_document

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store),
    embedding_model = Depends(get_embedding_model),
    settings = Depends(get_settings)
):
    """
    Update a document
    """
    documents_collection = db.documents
    chunks_collection = db.document_chunks
    
    # Get existing document
    existing_document = await documents_collection.find_one({"id": document_id})
    
    if not existing_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Create update dict
    update_data = {k: v for k, v in document_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now()
    
    # If content is updated, mark as not processed
    if "content" in update_data or "url" in update_data:
        update_data["processed"] = False
        update_data["chunk_count"] = 0
        
        # Delete existing chunks
        await chunks_collection.delete_many({"document_id": document_id})
        
        # Get chunk IDs to delete from vector store
        cursor = chunks_collection.find({"document_id": document_id})
        chunks = await cursor.to_list(length=None)
        chunk_ids = [chunk["id"] for chunk in chunks]
        
        # Delete from vector store
        if chunk_ids:
            await vector_store.delete_embeddings(chunk_ids)
    
    # Update document
    await documents_collection.update_one(
        {"id": document_id},
        {"$set": update_data}
    )
    
    # Get updated document
    updated_document = await documents_collection.find_one({"id": document_id})
    
    # Process document in background if content was updated
    if "content" in update_data or "url" in update_data:
        doc = Document(**updated_document)
        background_tasks.add_task(
            process_document_task,
            doc,
            db,
            vector_store,
            embedding_model,
            settings
        )
    
    return updated_document

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store)
):
    """
    Delete a document
    """
    documents_collection = db.documents
    chunks_collection = db.document_chunks
    
    # Get document
    document = await documents_collection.find_one({"id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Get chunk IDs to delete from vector store
    cursor = chunks_collection.find({"document_id": document_id})
    chunks = await cursor.to_list(length=None)
    chunk_ids = [chunk["id"] for chunk in chunks]
    
    # Delete document
    await documents_collection.delete_one({"id": document_id})
    
    # Delete chunks
    await chunks_collection.delete_many({"document_id": document_id})
    
    # Delete from vector store
    if chunk_ids:
        await vector_store.delete_embeddings(chunk_ids)
    
    return {"status": "deleted"}

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    tags: str = Form("[]"),
    metadata: str = Form("{}"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store),
    embedding_model = Depends(get_embedding_model),
    settings = Depends(get_settings)
):
    """
    Upload a document file
    """
    # Parse tags and metadata
    try:
        tags_list = json.loads(tags)
        metadata_dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tags or metadata format"
        )
    
    # Create data directory if it doesn't exist
    os.makedirs("data/uploads", exist_ok=True)
    
    # Generate filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = f"data/uploads/{filename}"
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get MIME type
    mime_type = file.content_type
    
    # Create document
    document_title = title or file.filename
    new_document = Document(
        title=document_title,
        file_path=file_path,
        mime_type=mime_type,
        tags=tags_list,
        metadata=metadata_dict
    )
    
    # Insert document
    documents_collection = db.documents
    await documents_collection.insert_one(new_document.dict())
    
    # Process document in background
    background_tasks.add_task(
        process_document_task,
        new_document,
        db,
        vector_store,
        embedding_model,
        settings
    )
    
    return new_document

@router.post("/crawl", response_model=DocumentResponse)
async def crawl_url(
    url: str,
    background_tasks: BackgroundTasks,
    title: Optional[str] = None,
    tags: List[str] = [],
    metadata: Dict[str, Any] = {},
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store),
    embedding_model = Depends(get_embedding_model),
    settings = Depends(get_settings)
):
    """
    Crawl a URL and add it as a document
    """
    # Validate URL
    if not validators.url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL"
        )
    
    # Create document
    document_title = title or url
    new_document = Document(
        title=document_title,
        url=url,
        tags=tags,
        metadata=metadata
    )
    
    # Insert document
    documents_collection = db.documents
    await documents_collection.insert_one(new_document.dict())
    
    # Process document in background
    background_tasks.add_task(
        process_document_task,
        new_document,
        db,
        vector_store,
        embedding_model,
        settings
    )
    
    return new_document

async def process_document_task(
    document: Document,
    db,
    vector_store,
    embedding_model,
    settings
):
    """Background task to process a document"""
    documents_collection = db.documents
    chunks_collection = db.document_chunks
    
    # Process document
    processor = DocumentProcessor(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        max_chunks_per_doc=settings.max_chunks_per_doc
    )
    
    # Process and chunk document
    updated_document, chunks = await processor.process_document(document)
    
    # Update document
    await documents_collection.update_one(
        {"id": document.id},
        {"$set": updated_document.dict()}
    )
    
    if not chunks:
        return
    
    # Insert chunks
    chunks_dicts = [chunk.dict() for chunk in chunks]
    if chunks_dicts:
        await chunks_collection.insert_many(chunks_dicts)
    
    # Generate embeddings
    texts = [chunk.content for chunk in chunks]
    chunk_ids = [chunk.id for chunk in chunks]
    
    try:
        embeddings = await embedding_model.embed_texts(texts)
        
        # Update chunks with embeddings
        for i, (chunk_id, embedding) in enumerate(zip(chunk_ids, embeddings)):
            await chunks_collection.update_one(
                {"id": chunk_id},
                {"$set": {"embedding": embedding}}
            )
        
        # Add to vector store
        await vector_store.add_embeddings(embeddings, chunk_ids)
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        # Update document with error
        await documents_collection.update_one(
            {"id": document.id},
            {"$set": {"error": f"Error generating embeddings: {str(e)}"}}
        )