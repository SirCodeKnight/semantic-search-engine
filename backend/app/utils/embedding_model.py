from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Union, Optional
import torch
import os
import openai
from tqdm import tqdm
import time

class EmbeddingModel:
    """
    Embedding model class for generating text embeddings
    """
    
    def __init__(
        self, 
        model_name: str = "all-MiniLM-L6-v2", 
        use_openai: bool = False,
        openai_api_key: Optional[str] = None,
        openai_model: str = "text-embedding-ada-002",
        cache_dir: Optional[str] = None
    ):
        """
        Initialize embedding model
        
        Args:
            model_name: Name of the sentence-transformers model
            use_openai: Whether to use OpenAI embeddings
            openai_api_key: OpenAI API key
            openai_model: OpenAI embedding model name
            cache_dir: Directory to cache models
        """
        self.model_name = model_name
        self.use_openai = use_openai
        self.openai_model = openai_model
        self.model = None
        self.batch_size = 32
        
        if use_openai:
            if not openai_api_key:
                raise ValueError("OpenAI API key is required when use_openai is True")
            openai.api_key = openai_api_key
        else:
            # Use sentence-transformers
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            self.model = SentenceTransformer(model_name, cache_folder=cache_dir, device=device)
    
    async def embed_query(self, query: str) -> List[float]:
        """
        Embed a single query text
        
        Args:
            query: Query text
            
        Returns:
            Embedding vector
        """
        if not query.strip():
            raise ValueError("Query text cannot be empty")
            
        if self.use_openai:
            return await self._openai_embed([query])[0]
        else:
            # Use sentence-transformers
            embedding = self.model.encode(query, convert_to_numpy=True)
            return embedding.tolist()
    
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Embed multiple texts
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
            
        # Filter out empty texts
        texts = [text for text in texts if text.strip()]
        
        if not texts:
            return []
            
        if self.use_openai:
            # Process in batches to avoid rate limits
            all_embeddings = []
            for i in tqdm(range(0, len(texts), self.batch_size), desc="Generating OpenAI embeddings"):
                batch = texts[i:i+self.batch_size]
                embeddings = await self._openai_embed(batch)
                all_embeddings.extend(embeddings)
                # Sleep to avoid rate limits
                if i + self.batch_size < len(texts):
                    time.sleep(0.5)
            return all_embeddings
        else:
            # Use sentence-transformers
            embeddings = self.model.encode(texts, convert_to_numpy=True, batch_size=self.batch_size, show_progress_bar=True)
            return embeddings.tolist()
    
    async def _openai_embed(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings from OpenAI API
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            response = openai.Embedding.create(
                model=self.openai_model,
                input=texts
            )
            return [item["embedding"] for item in response["data"]]
        except Exception as e:
            print(f"Error getting OpenAI embeddings: {e}")
            raise