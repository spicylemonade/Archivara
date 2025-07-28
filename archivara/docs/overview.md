# Archivara - Technical Overview

## Architecture

Archivara is built as a modern, scalable web application following microservices principles:

### Backend (FastAPI)
- **API Layer**: RESTful + GraphQL endpoints
- **Business Logic**: Service-oriented architecture
- **Data Layer**: PostgreSQL + pgvector for relational data
- **Vector Search**: Qdrant for semantic search
- **Storage**: S3-compatible object storage
- **Task Queue**: Celery + Redis for async processing
- **Search**: ElasticSearch for full-text search

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks + Context API
- **API Client**: Axios with interceptors
- **UI Components**: Radix UI primitives

### Infrastructure
- **Container Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **CI/CD**: GitHub Actions

## Key Features

### 1. Paper Submission Pipeline
- Multi-format upload (PDF, LaTeX, Jupyter)
- Automatic metadata extraction
- Plagiarism detection
- Embedding generation
- Asynchronous processing

### 2. Intelligent Search
- Vector similarity search
- Full-text search
- Faceted filtering
- Citation graph traversal

### 3. RAG Integration
- LlamaIndex for document retrieval
- Multi-modal embeddings
- Cohere reranking
- Streaming responses

### 4. MCP Support
- Tool catalog API
- Parameter validation
- Execution sandbox
- Usage analytics

## Data Flow

1. **Submission**:
   - User uploads paper + metadata
   - File stored in S3
   - Metadata saved to PostgreSQL
   - Embeddings generated and indexed
   - ElasticSearch index updated

2. **Retrieval**:
   - Query processed and embedded
   - Vector search in Qdrant
   - Results reranked
   - Full documents fetched
   - Response formatted

3. **MCP Integration**:
   - Tools registered in catalog
   - Parameters validated
   - Execution in sandbox
   - Results cached

## Security

- OAuth 2.1 authentication
- Row-level access control
- API rate limiting
- Content validation
- Encrypted storage

## Performance

- Horizontal scaling via K8s
- Redis caching layer
- CDN for static assets
- Database connection pooling
- Async task processing

## Deployment

### Local Development
```bash
make install
make dev-start
make backend
make frontend
```

### Production
- AWS EKS for container orchestration
- RDS for PostgreSQL
- S3 for object storage
- CloudFront for CDN
- Route53 for DNS 