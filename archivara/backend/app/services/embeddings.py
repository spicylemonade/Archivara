from typing import List, Optional, Union
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import structlog
from functools import lru_cache

from app.core.config import settings


logger = structlog.get_logger()


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the embedding model"""
        try:
            logger.info(
                "Loading embedding model",
                model=self.model_name,
                device=self.device
            )
            self.model = SentenceTransformer(self.model_name, device=self.device)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error("Failed to load embedding model", error=str(e))
            raise
    
    def embed_text(
        self,
        text: Union[str, List[str]],
        batch_size: int = 32,
        normalize: bool = True
    ) -> Union[List[float], List[List[float]]]:
        """
        Generate embeddings for text
        
        Args:
            text: Single text or list of texts
            batch_size: Batch size for encoding
            normalize: Whether to normalize embeddings
            
        Returns:
            Single embedding vector or list of embedding vectors
        """
        if self.model is None:
            raise RuntimeError("Embedding model not initialized")
        
        # Handle single text
        single_text = isinstance(text, str)
        if single_text:
            text = [text]
        
        try:
            # Generate embeddings
            embeddings = self.model.encode(
                text,
                batch_size=batch_size,
                normalize_embeddings=normalize,
                show_progress_bar=False,
                convert_to_numpy=True
            )
            
            # Convert to list for JSON serialization
            embeddings = embeddings.tolist()
            
            # Return single embedding if input was single text
            if single_text:
                return embeddings[0]
            return embeddings
            
        except Exception as e:
            logger.error("Failed to generate embeddings", error=str(e))
            raise
    
    def embed_paper_content(
        self,
        title: str,
        abstract: str,
        full_text: Optional[str] = None
    ) -> dict:
        """
        Generate embeddings for different parts of a paper
        
        Args:
            title: Paper title
            abstract: Paper abstract
            full_text: Optional full text of the paper
            
        Returns:
            Dictionary with embeddings for each part
        """
        embeddings = {}
        
        # Embed title
        embeddings["title"] = self.embed_text(title)
        
        # Embed abstract
        embeddings["abstract"] = self.embed_text(abstract)
        
        # Embed full text if provided
        if full_text:
            # For long texts, we might want to chunk and average
            # For now, we'll truncate to model's max length
            max_length = self.model.max_seq_length
            if len(full_text) > max_length * 4:  # Rough estimate
                # Take beginning, middle, and end portions
                chunk_size = max_length
                chunks = [
                    full_text[:chunk_size],
                    full_text[len(full_text)//2 - chunk_size//2:len(full_text)//2 + chunk_size//2],
                    full_text[-chunk_size:]
                ]
                chunk_embeddings = self.embed_text(chunks)
                # Average the embeddings
                embeddings["full_text"] = np.mean(chunk_embeddings, axis=0).tolist()
            else:
                embeddings["full_text"] = self.embed_text(full_text)
        
        return embeddings
    
    def compute_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Compute cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score
        """
        # Convert to numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Compute cosine similarity
        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        
        return float(similarity)
    
    @lru_cache(maxsize=1000)
    def embed_query(self, query: str) -> List[float]:
        """
        Cached method for embedding search queries
        
        Args:
            query: Search query text
            
        Returns:
            Embedding vector
        """
        return self.embed_text(query)
    
    def batch_embed_papers(
        self,
        papers: List[dict],
        batch_size: int = 16
    ) -> List[dict]:
        """
        Batch embed multiple papers
        
        Args:
            papers: List of paper dictionaries with title, abstract, and optionally full_text
            batch_size: Batch size for processing
            
        Returns:
            List of embedding dictionaries
        """
        # Collect all texts
        titles = [p["title"] for p in papers]
        abstracts = [p["abstract"] for p in papers]
        
        # Batch embed
        title_embeddings = self.embed_text(titles, batch_size=batch_size)
        abstract_embeddings = self.embed_text(abstracts, batch_size=batch_size)
        
        # Process full texts if available
        full_text_embeddings = []
        papers_with_full_text = [p for p in papers if p.get("full_text")]
        if papers_with_full_text:
            full_texts = [p["full_text"] for p in papers_with_full_text]
            full_text_embeddings = self.embed_text(full_texts, batch_size=batch_size)
        
        # Combine results
        results = []
        full_text_idx = 0
        for i, paper in enumerate(papers):
            embedding_dict = {
                "paper_id": paper.get("id"),
                "title_embedding": title_embeddings[i],
                "abstract_embedding": abstract_embeddings[i]
            }
            
            if paper.get("full_text"):
                embedding_dict["full_text_embedding"] = full_text_embeddings[full_text_idx]
                full_text_idx += 1
            
            results.append(embedding_dict)
        
        return results
    
    def get_model_info(self) -> dict:
        """Get information about the embedding model"""
        if self.model is None:
            return {"error": "Model not initialized"}
        
        return {
            "model_name": self.model_name,
            "device": self.device,
            "max_seq_length": self.model.max_seq_length,
            "embedding_dimension": self.model.get_sentence_embedding_dimension()
        }


# Singleton instance
embedding_service = EmbeddingService() 