from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import uuid
import openai
from app.models.chat import Message, Conversation, ChatRequest, ChatResponse
from app.models.search import SearchQuery
from app.dependencies import get_database, get_vector_store, get_embedding_model, verify_api_key, get_settings
from app.models.settings import Settings

router = APIRouter(prefix="/chat", dependencies=[Depends(verify_api_key)])

@router.get("/conversations", response_model=List[Conversation])
async def get_conversations(
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all conversations
    """
    conversations_collection = db.conversations
    cursor = conversations_collection.find({}).sort("updated_at", -1).skip(skip).limit(limit)
    conversations = await cursor.to_list(length=limit)
    return conversations

@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a conversation by ID
    """
    conversations_collection = db.conversations
    conversation = await conversations_collection.find_one({"id": conversation_id})
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a conversation
    """
    conversations_collection = db.conversations
    result = await conversations_collection.delete_one({"id": conversation_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {"status": "deleted"}

@router.post("", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
    vector_store = Depends(get_vector_store),
    embedding_model = Depends(get_embedding_model),
    settings: Settings = Depends(get_settings)
):
    """
    Send a message to the chatbot
    """
    conversations_collection = db.conversations
    
    # Get or create conversation
    conversation = None
    if request.conversation_id:
        conversation = await conversations_collection.find_one({"id": request.conversation_id})
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
    
    if not conversation:
        # Create new conversation
        conversation = {
            "id": str(uuid.uuid4()),
            "title": f"Conversation {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "messages": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await conversations_collection.insert_one(conversation)
    
    # Add user message
    user_message = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": request.message,
        "created_at": datetime.now()
    }
    
    # Update conversation with new message
    await conversations_collection.update_one(
        {"id": conversation["id"]},
        {
            "$push": {"messages": user_message},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Get relevant documents
    query_embedding = await embedding_model.embed_query(request.message)
    vector_results = await vector_store.search(
        query_embedding=query_embedding,
        limit=5,
        min_score=0.5
    )
    
    sources = []
    if vector_results:
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
        
        # Format sources
        for result in vector_results:
            chunk_id = result["chunk_id"]
            chunk = chunks_map.get(chunk_id)
            
            if not chunk:
                continue
                
            document_id = chunk["document_id"]
            document = documents_map.get(document_id)
            
            if not document:
                continue
                
            sources.append({
                "document_id": document["id"],
                "chunk_id": chunk["id"],
                "title": document["title"],
                "content_snippet": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
                "score": result["score"]
            })
    
    # Generate response using OpenAI if configured, otherwise use a template response
    if settings.openai_api_key:
        # Get conversation history (limited to context window)
        conversation = await conversations_collection.find_one({"id": conversation["id"]})
        history = conversation["messages"][-request.context_window:] if len(conversation["messages"]) > request.context_window else conversation["messages"]
        
        # Format messages for OpenAI
        messages = [{"role": msg["role"], "content": msg["content"]} for msg in history]
        
        # Add system message with context
        system_message = {"role": "system", "content": "You are a helpful assistant with access to a semantic search system."}
        
        if sources:
            system_message["content"] += " Below are relevant documents that may help answer the user's question:\n\n"
            for i, source in enumerate(sources):
                system_message["content"] += f"Document {i+1}: {source['title']}\n"
                system_message["content"] += f"Content: {source['content_snippet']}\n\n"
            
            system_message["content"] += "Use this information to provide an accurate and helpful response. If the information doesn't fully answer the question, acknowledge what you know and what you don't know."
        
        messages.insert(0, system_message)
        
        try:
            # Call OpenAI API
            openai.api_key = settings.openai_api_key
            response = openai.ChatCompletion.create(
                model=settings.openai_chat_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
        except Exception as e:
            # Fallback to template response if OpenAI fails
            response_text = f"I found {len(sources)} relevant documents that might help answer your question."
            if sources:
                response_text += " Here's what I found:\n\n"
                for i, source in enumerate(sources):
                    response_text += f"From '{source['title']}':\n{source['content_snippet']}\n\n"
            else:
                response_text += " However, I couldn't find any specific information related to your query. Could you please provide more details or rephrase your question?"
    else:
        # Template response when OpenAI is not configured
        response_text = f"I found {len(sources)} relevant documents that might help answer your question."
        if sources:
            response_text += " Here's what I found:\n\n"
            for i, source in enumerate(sources):
                response_text += f"From '{source['title']}':\n{source['content_snippet']}\n\n"
        else:
            response_text += " However, I couldn't find any specific information related to your query. Could you please provide more details or rephrase your question?"
    
    # Create assistant message
    assistant_message = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": response_text,
        "created_at": datetime.now()
    }
    
    # Update conversation with assistant message
    await conversations_collection.update_one(
        {"id": conversation["id"]},
        {
            "$push": {"messages": assistant_message},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Return response
    return {
        "conversation_id": conversation["id"],
        "message": assistant_message,
        "sources": sources
    }