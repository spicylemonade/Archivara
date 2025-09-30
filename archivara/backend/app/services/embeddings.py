from typing import List, Optional, Union
import numpy as np
import structlog
from functools import lru_cache

from app.core.config import settings


logger = structlog.get_logger()


class EmbeddingService:
    """Stub service for text embeddings - ML packages not installed"""

    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.device = "cpu"
        self.model = None
        logger.warning("EmbeddingService initialized in stub mode - ML packages not installed")

    def _initialize_model(self):
        """Stub - model not loaded"""
        pass

    def embed_text(
        self,
        text: Union[str, List[str]],
        batch_size: int = 32,
        normalize: bool = True
    ) -> Union[List[float], List[List[float]]]:
        """Stub - returns dummy embeddings"""
        logger.warning("embed_text called but ML packages not installed - returning dummy embeddings")

        single_text = isinstance(text, str)
        if single_text:
            text = [text]

        # Return dummy 768-dimensional embeddings (BERT-like)
        dummy_embedding = [0.0] * 768
        embeddings = [dummy_embedding for _ in text]

        if single_text:
            return embeddings[0]
        return embeddings

    def embed_paper_content(
        self,
        title: str,
        abstract: str,
        full_text: Optional[str] = None
    ) -> dict:
        """Stub - returns dummy embeddings"""
        logger.warning("embed_paper_content called but ML packages not installed")

        dummy_embedding = [0.0] * 768
        embeddings = {
            "title": dummy_embedding,
            "abstract": dummy_embedding
        }

        if full_text:
            embeddings["full_text"] = dummy_embedding

        return embeddings

    def compute_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """Compute cosine similarity between two embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = np.dot(vec1, vec2) / (norm1 * norm2)
        return float(similarity)

    @lru_cache(maxsize=1000)
    def embed_query(self, query: str) -> List[float]:
        """Stub - returns dummy embedding"""
        return self.embed_text(query)

    def batch_embed_papers(
        self,
        papers: List[dict],
        batch_size: int = 16
    ) -> List[dict]:
        """Stub - returns dummy embeddings"""
        logger.warning("batch_embed_papers called but ML packages not installed")

        dummy_embedding = [0.0] * 768
        results = []

        for paper in papers:
            embedding_dict = {
                "paper_id": paper.get("id"),
                "title_embedding": dummy_embedding,
                "abstract_embedding": dummy_embedding
            }

            if paper.get("full_text"):
                embedding_dict["full_text_embedding"] = dummy_embedding

            results.append(embedding_dict)

        return results

    def get_model_info(self) -> dict:
        """Get information about the embedding model"""
        return {
            "model_name": "stub",
            "device": "cpu",
            "max_seq_length": 512,
            "embedding_dimension": 768,
            "note": "ML packages not installed - using stub embeddings"
        }


# Singleton instance
embedding_service = EmbeddingService()