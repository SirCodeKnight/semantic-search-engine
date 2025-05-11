from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from app.dependencies import get_embedding_model, verify_api_key

router = APIRouter(prefix="/embeddings", dependencies=[Depends(verify_api_key)])

class EmbeddingRequest(BaseModel):
    text: str
    
    class Config:
        schema_extra = {
            "example": {
                "text": "Text to convert to embeddings"
            }
        }

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    
    class Config:
        schema_extra = {
            "example": {
                "embedding": [0.1, 0.2, 0.3, 0.4, 0.5]  # truncated for brevity
            }
        }

class BatchEmbeddingRequest(BaseModel):
    texts: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "texts": ["First text", "Second text", "Third text"]
            }
        }

class BatchEmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    
    class Config:
        schema_extra = {
            "example": {
                "embeddings": [
                    [0.1, 0.2, 0.3],  # truncated for brevity
                    [0.4, 0.5, 0.6],
                    [0.7, 0.8, 0.9]
                ]
            }
        }

@router.post("", response_model=EmbeddingResponse)
async def create_embedding(
    request: EmbeddingRequest,
    embedding_model = Depends(get_embedding_model)
):
    """
    Create an embedding for a single text
    """
    try:
        embedding = await embedding_model.embed_query(request.text)
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating embedding: {str(e)}"
        )

@router.post("/batch", response_model=BatchEmbeddingResponse)
async def create_batch_embeddings(
    request: BatchEmbeddingRequest,
    embedding_model = Depends(get_embedding_model)
):
    """
    Create embeddings for multiple texts
    """
    if not request.texts:
        return {"embeddings": []}
        
    try:
        embeddings = await embedding_model.embed_texts(request.texts)
        return {"embeddings": embeddings}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating embeddings: {str(e)}"
        )