import faiss
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import os
import pickle
import asyncio
from app.models.settings import Settings

class VectorStore:
    """
    Vector store class using FAISS to store and query embeddings
    """
    
    def __init__(self, dimension: int = 384, index_type: str = "Flat"):
        """
        Initialize vector store with specified dimension and index type
        
        Args:
            dimension: Dimension of embeddings
            index_type: Type of FAISS index (Flat, IVF, HNSW)
        """
        self.dimension = dimension
        self.index_type = index_type
        self.index = None
        self.id_map = {}  # Maps FAISS IDs to document chunk IDs
        self.settings = Settings()
        self.index_path = os.path.join("data", "faiss_index.bin")
        self.id_map_path = os.path.join("data", "id_map.pkl")
        
    async def load_or_create_index(self) -> None:
        """Load existing index or create a new one"""
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        
        # Try to load existing index
        if os.path.exists(self.index_path) and os.path.exists(self.id_map_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.id_map_path, "rb") as f:
                    self.id_map = pickle.load(f)
                print(f"Loaded existing index with {self.index.ntotal} vectors")
                return
            except Exception as e:
                print(f"Error loading index: {e}")
                print("Creating new index")
        
        # Create new index
        self._create_index()
    
    def _create_index(self) -> None:
        """Create FAISS index based on index_type"""
        if self.index_type == "Flat":
            self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        elif self.index_type == "IVF":
            quantizer = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, 100)
            self.index.train(np.random.random((1000, self.dimension)).astype(np.float32))
        elif self.index_type == "HNSW":
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)
        else:
            # Default to Flat index
            self.index = faiss.IndexFlatIP(self.dimension)
        
        self.id_map = {}
        print(f"Created new {self.index_type} index with dimension {self.dimension}")
    
    async def save_index(self) -> None:
        """Save index and ID map to disk"""
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.id_map_path, "wb") as f:
                pickle.dump(self.id_map, f)
            print(f"Saved index with {self.index.ntotal} vectors")
        except Exception as e:
            print(f"Error saving index: {e}")
    
    async def add_embeddings(self, embeddings: List[List[float]], chunk_ids: List[str]) -> None:
        """
        Add embeddings to the index
        
        Args:
            embeddings: List of embedding vectors
            chunk_ids: List of document chunk IDs corresponding to embeddings
        """
        if len(embeddings) == 0:
            return
            
        # Convert embeddings to numpy array
        embeddings_np = np.array(embeddings).astype(np.float32)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings_np)
        
        # Get next available IDs
        next_id = self.index.ntotal
        ids = np.arange(next_id, next_id + len(embeddings_np)).astype(np.int64)
        
        # Add embeddings to index
        self.index.add_with_ids(embeddings_np, ids)
        
        # Update ID map
        for i, chunk_id in enumerate(chunk_ids):
            self.id_map[int(ids[i])] = chunk_id
        
        # Save index
        await self.save_index()
    
    async def search(self, query_embedding: List[float], limit: int = 10, min_score: float = 0.0) -> List[Dict[str, Any]]:
        """
        Search for similar embeddings
        
        Args:
            query_embedding: Query embedding vector
            limit: Maximum number of results
            min_score: Minimum similarity score threshold
            
        Returns:
            List of dictionaries with chunk_id and score
        """
        if self.index.ntotal == 0:
            return []
            
        # Convert query to numpy array and normalize
        query_np = np.array([query_embedding]).astype(np.float32)
        faiss.normalize_L2(query_np)
        
        # Search index
        scores, indices = self.index.search(query_np, limit)
        
        # Process results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1 or scores[0][i] < min_score:  # -1 means no result
                continue
                
            chunk_id = self.id_map.get(int(idx))
            if chunk_id:
                results.append({
                    "chunk_id": chunk_id,
                    "score": float(scores[0][i])
                })
                
        return results
    
    async def delete_embeddings(self, chunk_ids: List[str]) -> None:
        """
        Delete embeddings from the index
        
        Args:
            chunk_ids: List of document chunk IDs to delete
        """
        # Find FAISS IDs to remove
        faiss_ids = []
        for faiss_id, chunk_id in self.id_map.items():
            if chunk_id in chunk_ids:
                faiss_ids.append(faiss_id)
        
        if not faiss_ids:
            return
            
        # Remove from FAISS index
        # Note: FAISS doesn't support direct deletion in all index types
        # For simplicity, we'll recreate the index excluding deleted items
        # This is inefficient for large indexes but works for demonstration
        
        # Get all vectors
        all_ids = np.arange(self.index.ntotal).astype(np.int64)
        all_vectors = np.zeros((self.index.ntotal, self.dimension), dtype=np.float32)
        
        for i in range(self.index.ntotal):
            if i not in faiss_ids:
                # Construct a query to get the vector
                query = np.zeros((1, self.dimension), dtype=np.float32)
                query[0, 0] = 1.0  # Just a placeholder
                _, indices = self.index.search(query, self.index.ntotal)
                if i in indices[0]:
                    vector_idx = np.where(indices[0] == i)[0][0]
                    all_vectors[i] = query[0]
        
        # Create new index
        self._create_index()
        
        # Add vectors back, excluding deleted ones
        new_vectors = []
        new_ids = []
        new_id_map = {}
        
        next_id = 0
        for i, vector in enumerate(all_vectors):
            if i not in faiss_ids:
                new_vectors.append(vector)
                new_ids.append(next_id)
                new_id_map[next_id] = self.id_map[i]
                next_id += 1
        
        if new_vectors:
            self.index.add(np.array(new_vectors))
            self.id_map = new_id_map
            
        # Save index
        await self.save_index()
    
    async def reset_index(self) -> None:
        """Reset the index, removing all embeddings"""
        self._create_index()
        await self.save_index()