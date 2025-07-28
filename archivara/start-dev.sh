#!/bin/bash

echo "🚀 Starting Archivara Development Environment..."

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker and docker-compose first."
    exit 1
fi

# Start infrastructure services
echo "📦 Starting infrastructure services..."
docker-compose up -d postgres redis qdrant elasticsearch minio

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Create MinIO bucket
echo "🪣 Creating MinIO bucket..."
docker exec -it archivara-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin || true
docker exec -it archivara-minio mc mb myminio/archivara-artifacts || true

# Initialize Qdrant collection
echo "🔍 Initializing Qdrant collection..."
curl -X PUT 'http://localhost:6333/collections/papers' \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "title": {"size": 1024, "distance": "Cosine"},
      "abstract": {"size": 1024, "distance": "Cosine"},
      "full_text": {"size": 1024, "distance": "Cosine"}
    }
  }' || true

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file from example..."
    cp backend/env.example backend/.env
fi

echo "✅ Infrastructure is ready!"
echo ""
echo "To start the backend API:"
echo "  cd backend"
echo "  python -m venv venv"
echo "  source venv/bin/activate"
echo "  pip install -r requirements.txt"
echo "  uvicorn app.main:app --reload"
echo ""
echo "To start the frontend:"
echo "  cd frontend"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Qdrant: localhost:6333"
echo "  - ElasticSearch: localhost:9200"
echo "  - MinIO: localhost:9000 (console: localhost:9001)"
echo "  - Flower (Celery): localhost:5555" 