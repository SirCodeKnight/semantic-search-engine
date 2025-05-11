from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import time
import re
from app.models.search import SearchQuery, SearchResponse, SearchResult, SuggestQuery, SuggestResponse
from app.models.document import Document, DocumentChunk
from app.dependencies import get_database, get_vector_store, get_embedding_model, verify_api_key

router = APIRouter(prefix="/search", dependencies=[Depends(verify_api_key)])

@router.post("", response_model=SearchResponse)
async def search_documents(
    query: SearchQuery,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store),
    embedding_model = Depends(get_embedding_model)
):
    """
    Search for documents using semantic search
    """
    start_time = time.time()
    
    # Get embedding for query
    try:
        query_embedding = await embedding_model.embed_query(query.query)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating embedding: {str(e)}"
        )
    
    # Search vector store
    vector_results = await vector_store.search(
        query_embedding=query_embedding,
        limit=query.limit * 2,  # Get more results for filtering
        min_score=query.min_score
    )
    
    if not vector_results:
        return SearchResponse(
            results=[],
            total=0,
            query=query.query,
            search_time=time.time() - start_time
        )
    
    # Get chunk IDs
    chunk_ids = [result["chunk_id"] for result in vector_results]
    
    # Get chunks from database
    chunks_collection = db.document_chunks
    chunks_cursor = chunks_collection.find({"id": {"$in": chunk_ids}})
    chunks = await chunks_cursor.to_list(length=None)
    
    # Map chunks by ID
    chunks_map = {chunk["id"]: chunk for chunk in chunks}
    
    # Get document IDs
    document_ids = list(set(chunk["document_id"] for chunk in chunks))
    
    # Get documents from database
    documents_collection = db.documents
    documents_cursor = documents_collection.find({"id": {"$in": document_ids}})
    documents = await documents_cursor.to_list(length=None)
    
    # Map documents by ID
    documents_map = {doc["id"]: doc for doc in documents}
    
    # Apply filters if provided
    filtered_results = []
    for result in vector_results:
        chunk_id = result["chunk_id"]
        chunk = chunks_map.get(chunk_id)
        
        if not chunk:
            continue
            
        document_id = chunk["document_id"]
        document = documents_map.get(document_id)
        
        if not document:
            continue
            
        # Apply filters
        if query.filters:
            match = True
            for key, value in query.filters.items():
                if key.startswith("metadata."):
                    # Filter on metadata field
                    metadata_key = key.replace("metadata.", "")
                    if metadata_key not in document.get("metadata", {}) or document["metadata"][metadata_key] != value:
                        match = False
                        break
                elif key == "tags":
                    # Filter on tags
                    if not set(value).issubset(set(document.get("tags", []))):
                        match = False
                        break
                else:
                    # Filter on document field
                    if key not in document or document[key] != value:
                        match = False
                        break
            
            if not match:
                continue
        
        filtered_results.append({
            "result": result,
            "chunk": chunk,
            "document": document
        })
    
    # Take top results after filtering
    filtered_results = filtered_results[query.offset:query.offset + query.limit]
    
    # Format results
    search_results = []
    for item in filtered_results:
        result = item["result"]
        chunk = item["chunk"]
        document = item["document"]
        
        # Generate highlights (simple keyword matching for demo)
        highlights = []
        if "content" in chunk:
            content = chunk["content"]
            
            # Extract keywords from query
            keywords = re.findall(r'\w+', query.query.lower())
            keywords = [k for k in keywords if len(k) > 3]  # Only use words with length > 3
            
            # Find matches
            for keyword in keywords:
                pattern = re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE)
                matches = pattern.finditer(content)
                
                for match in matches:
                    start, end = match.span()
                    # Get context around match (50 chars before and after)
                    context_start = max(0, start - 50)
                    context_end = min(len(content), end + 50)
                    
                    # Extract context
                    if context_start > 0:
                        context = "..." + content[context_start:context_end]
                    else:
                        context = content[context_start:context_end]
                        
                    if context_end < len(content):
                        context += "..."
                        
                    highlights.append(context)
                    
                    # Limit to 3 highlights per result
                    if len(highlights) >= 3:
                        break
                        
                if len(highlights) >= 3:
                    break
        
        # Create search result
        search_result = SearchResult(
            document_id=document["id"],
            chunk_id=chunk["id"],
            title=document["title"],
            content=chunk["content"] if query.include_content else None,
            url=document.get("url"),
            score=result["score"],
            metadata=document.get("metadata", {}),
            tags=document.get("tags", []),
            highlights=highlights,
            created_at=document["created_at"]
        )
        
        search_results.append(search_result)
    
    # Calculate search time
    search_time = time.time() - start_time
    
    return SearchResponse(
        results=search_results,
        total=len(filtered_results),
        query=query.query,
        search_time=search_time
    )

@router.post("/suggest", response_model=SuggestResponse)
async def suggest_queries(
    query: SuggestQuery,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get query suggestions based on prefix
    """
    # Simple implementation using past queries
    queries_collection = db.search_queries
    
    # Find queries that start with prefix
    cursor = queries_collection.find(
        {"query": {"$regex": f"^{re.escape(query.prefix)}", "$options": "i"}},
        sort=[("count", -1)],
        limit=query.limit
    )
    
    queries = await cursor.to_list(length=query.limit)
    suggestions = [q["query"] for q in queries]
    
    # If we don't have enough suggestions from history,
    # add some based on document titles
    if len(suggestions) < query.limit:
        documents_collection = db.documents
        cursor = documents_collection.find(
            {"title": {"$regex": f".*{re.escape(query.prefix)}.*", "$options": "i"}},
            limit=query.limit - len(suggestions)
        )
        
        documents = await cursor.to_list(length=query.limit - len(suggestions))
        title_suggestions = [doc["title"] for doc in documents]
        
        # Add title suggestions if they're not already in the list
        for suggestion in title_suggestions:
            if suggestion not in suggestions:
                suggestions.append(suggestion)
                
                if len(suggestions) >= query.limit:
                    break
    
    return SuggestResponse(suggestions=suggestions)

@router.post("/record-query")
async def record_search_query(
    query: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Record search query for suggestions
    """
    queries_collection = db.search_queries
    
    # Check if query already exists
    existing_query = await queries_collection.find_one({"query": query})
    
    if existing_query:
        # Update count
        await queries_collection.update_one(
            {"query": query},
            {"$inc": {"count": 1}, "$set": {"last_used": datetime.now()}}
        )
    else:
        # Create new record
        await queries_collection.insert_one({
            "query": query,
            "count": 1,
            "created_at": datetime.now(),
            "last_used": datetime.now()
        })
    
    return {"status": "recorded"}