from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition,
    Range, SearchRequest, SearchParams, QuantizationConfig,
    CreateCollection, OptimizersConfig, CollectionStatus
)
import structlog

from app.core.config import settings


logger = structlog.get_logger()


class VectorDBService:
    """Service for managing vector embeddings in Qdrant"""
    
    def __init__(self):
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY,
            timeout=30
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
    
    async def initialize_collection(self):
        """Create collection if it doesn't exist"""
        try:
            collections = await self.client.get_collections()
            collection_names = [c.name for c in collections.collections]
            
            if self.collection_name not in collection_names:
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config={
                        "title": VectorParams(
                            size=self.embedding_dimension,
                            distance=Distance.COSINE
                        ),
                        "abstract": VectorParams(
                            size=self.embedding_dimension,
                            distance=Distance.COSINE
                        ),
                        "full_text": VectorParams(
                            size=self.embedding_dimension,
                            distance=Distance.COSINE
                        )
                    },
                    optimizers_config=OptimizersConfig(
                        default_segment_number=2,
                        max_segment_size=100000
                    )
                )
                logger.info("Created Qdrant collection", collection=self.collection_name)
            else:
                logger.info("Qdrant collection exists", collection=self.collection_name)
                
        except Exception as e:
            logger.error("Failed to initialize Qdrant collection", error=str(e))
            raise
    
    async def index_paper(
        self,
        paper_id: UUID,
        title_embedding: List[float],
        abstract_embedding: List[float],
        full_text_embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Index a paper's embeddings"""
        try:
            # Prepare metadata
            payload = metadata or {}
            payload["paper_id"] = str(paper_id)
            
            # Create point
            vectors = {
                "title": title_embedding,
                "abstract": abstract_embedding
            }
            if full_text_embedding:
                vectors["full_text"] = full_text_embedding
            
            point = PointStruct(
                id=str(paper_id),
                vectors=vectors,
                payload=payload
            )
            
            # Upsert to Qdrant
            await self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            logger.info("Indexed paper in vector DB", paper_id=str(paper_id))
            return True
            
        except Exception as e:
            logger.error("Failed to index paper", paper_id=str(paper_id), error=str(e))
            return False
    
    async def search_similar_papers(
        self,
        query_embedding: List[float],
        vector_name: str = "abstract",
        top_k: int = 10,
        score_threshold: float = 0.5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        Search for similar papers
        
        Args:
            query_embedding: Query vector
            vector_name: Which vector to search ("title", "abstract", "full_text")
            top_k: Number of results
            score_threshold: Minimum similarity score
            filters: Additional filters
            
        Returns:
            List of tuples (paper_id, score, metadata)
        """
        try:
            # Build filter conditions
            filter_conditions = []
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        # Handle array fields
                        for v in value:
                            filter_conditions.append(
                                FieldCondition(key=key, match={"value": v})
                            )
                    else:
                        filter_conditions.append(
                            FieldCondition(key=key, match={"value": value})
                        )
            
            # Perform search
            search_result = await self.client.search(
                collection_name=self.collection_name,
                query_vector=(vector_name, query_embedding),
                limit=top_k,
                score_threshold=score_threshold,
                query_filter=Filter(must=filter_conditions) if filter_conditions else None
            )
            
            # Format results
            results = []
            for hit in search_result:
                results.append((
                    hit.payload.get("paper_id"),
                    hit.score,
                    hit.payload
                ))
            
            logger.info(
                "Vector search completed",
                vector_name=vector_name,
                results_count=len(results)
            )
            return results
            
        except Exception as e:
            logger.error("Vector search failed", error=str(e))
            raise
    
    async def get_paper_embeddings(
        self,
        paper_id: UUID
    ) -> Optional[Dict[str, List[float]]]:
        """Retrieve embeddings for a specific paper"""
        try:
            result = await self.client.retrieve(
                collection_name=self.collection_name,
                ids=[str(paper_id)],
                with_vectors=True
            )
            
            if result:
                point = result[0]
                return {
                    "title": point.vectors.get("title"),
                    "abstract": point.vectors.get("abstract"),
                    "full_text": point.vectors.get("full_text")
                }
            return None
            
        except Exception as e:
            logger.error("Failed to retrieve embeddings", paper_id=str(paper_id), error=str(e))
            return None
    
    async def delete_paper(self, paper_id: UUID) -> bool:
        """Delete a paper from the vector database"""
        try:
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector=[str(paper_id)]
            )
            logger.info("Deleted paper from vector DB", paper_id=str(paper_id))
            return True
        except Exception as e:
            logger.error("Failed to delete paper", paper_id=str(paper_id), error=str(e))
            return False
    
    async def batch_index_papers(
        self,
        papers: List[Dict[str, Any]]
    ) -> int:
        """Batch index multiple papers"""
        points = []
        
        for paper in papers:
            paper_id = paper["paper_id"]
            vectors = {
                "title": paper["title_embedding"],
                "abstract": paper["abstract_embedding"]
            }
            if paper.get("full_text_embedding"):
                vectors["full_text"] = paper["full_text_embedding"]
            
            payload = paper.get("metadata", {})
            payload["paper_id"] = str(paper_id)
            
            points.append(
                PointStruct(
                    id=str(paper_id),
                    vectors=vectors,
                    payload=payload
                )
            )
        
        try:
            await self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info("Batch indexed papers", count=len(points))
            return len(points)
        except Exception as e:
            logger.error("Batch indexing failed", error=str(e))
            raise
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        try:
            info = await self.client.get_collection(self.collection_name)
            return {
                "status": info.status,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "segments_count": info.segments_count,
                "config": info.config
            }
        except Exception as e:
            logger.error("Failed to get collection info", error=str(e))
            raise


# Singleton instance
vector_db_service = VectorDBService() 