# 🦉 Archivara - Academic Research Platform

Archivara is a comprehensive platform for storing, organizing, and discovering machine-generated research papers, code, and model artifacts. It provides a modern interface for academic research with powerful search capabilities and collaborative features.

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** 
- **Node.js 18+** and **npm**
- **PostgreSQL 12+** with **pgvector extension**
- **Docker** and **Docker Compose** (optional but recommended)
- **Git**

### Option 1: Docker Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Archivara
   ```

2. **Start infrastructure services:**
   ```bash
   make dev-start
   # OR manually:
   docker-compose up -d
   ```

3. **Set up the backend:**
   ```bash
   cd archivara/backend
   cp env.example .env
   # Edit .env file with your settings
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run database migrations
   alembic upgrade head
   
   # Start the backend server
   uvicorn app.main:app --reload --port 8000
   ```

4. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Local Services Setup

If you prefer to run services locally instead of Docker:

#### 1. PostgreSQL Setup

**Install PostgreSQL and pgvector:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib postgresql-server-dev-all
sudo -u postgres createuser -s archivara
sudo -u postgres createdb archivara
sudo -u postgres psql -c "ALTER USER archivara PASSWORD 'archivara_pass';"

# Install pgvector extension
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector
sudo make install
sudo -u postgres psql archivara -c "CREATE EXTENSION vector;"
```

**Or using Docker for PostgreSQL only:**
```bash
docker run -d \
  --name archivara-postgres \
  -e POSTGRES_USER=archivara \
  -e POSTGRES_PASSWORD=archivara_pass \
  -e POSTGRES_DB=archivara \
  -p 5432:5432 \
  ankane/pgvector
```

#### 2. Redis Setup

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# Or with Docker
docker run -d --name archivara-redis -p 6379:6379 redis:alpine
```

#### 3. Backend Setup

```bash
cd archivara/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env

# Edit .env file - update DATABASE_URL if needed:
echo "DATABASE_URL=postgresql+asyncpg://archivara:archivara_pass@localhost:5432/archivara" >> .env

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

#### 4. Frontend Setup

```bash
cd archivara/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Architecture

### Backend Stack
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Primary database with pgvector for embeddings
- **Redis** - Caching and session storage
- **Qdrant** - Vector database for semantic search
- **Elasticsearch** - Full-text search engine
- **MinIO** - S3-compatible object storage
- **Celery** - Distributed task queue
- **Alembic** - Database migration tool

### Frontend Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless component library
- **Lucide React** - Icon library

## 📁 Project Structure

```
Archivara/
├── archivara/
│   ├── backend/           # Python FastAPI backend
│   │   ├── app/
│   │   │   ├── api/       # API routes
│   │   │   ├── core/      # Core configuration
│   │   │   ├── models/    # SQLAlchemy models
│   │   │   ├── schemas/   # Pydantic schemas
│   │   │   └── services/  # Business logic
│   │   ├── alembic/       # Database migrations
│   │   └── requirements.txt
│   ├── frontend/          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/# React components
│   │   │   └── lib/       # Utilities
│   │   └── package.json
│   └── docker-compose.yml # Development services
├── docs/                  # Documentation
└── scripts/              # Setup scripts
```

## 🔧 Development Commands

### Backend Commands
```bash
cd archivara/backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Start development server
uvicorn app.main:app --reload --port 8000

# Run in background
nohup uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > backend.log 2>&1 &
```

### Frontend Commands
```bash
cd archivara/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Commands
```bash
# Start all services
make dev-start
# OR
docker-compose up -d

# Stop all services
make dev-stop
# OR
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres
```

## 🔑 Environment Variables

### Backend (.env)
```bash
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=archivara
POSTGRES_PASSWORD=archivara_pass
POSTGRES_DB=archivara
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://archivara:archivara_pass@localhost:5432/archivara

# Redis
REDIS_URL=redis://localhost:6379/0

# Vector Database
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Search
ELASTICSEARCH_URL=http://localhost:9200

# Object Storage
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=archivara

# Task Queue
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
```

## 🗃️ Database Setup

### Initial Migration
```bash
cd archivara/backend
source venv/bin/activate

# If alembic version is out of sync
sudo -u postgres psql archivara -c "DROP TABLE IF EXISTS alembic_version;"
alembic stamp base
alembic upgrade head
```

### Common Database Issues

**Password authentication failed:**
```bash
# Reset PostgreSQL user password
sudo -u postgres psql -c "ALTER USER archivara PASSWORD 'archivara_pass';"
```

**Database doesn't exist:**
```bash
# Create database
sudo -u postgres createdb archivara
```

**pgvector extension missing:**
```bash
# Install pgvector extension
sudo -u postgres psql archivara -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## 🧪 Testing

### Create Test User
```bash
# Register a new user via API
curl -X POST "http://localhost:8000/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@archivara.com",
    "password": "demo123",
    "full_name": "Demo User"
  }'
```

### Login Test
```bash
# Login with form data
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo@archivara.com&password=demo123"
```

## 🚨 Troubleshooting

### Backend Won't Start

1. **Module not found errors:**
   ```bash
   # Make sure you're in the virtual environment
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Database connection issues:**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U archivara -d archivara
   ```

3. **Port already in use:**
   ```bash
   # Find what's using the port
   sudo lsof -i :8000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

### Frontend Issues

1. **Port conflicts:**
   Next.js will automatically try ports 3001, 3002, etc.

2. **Node modules issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Common Fixes

1. **Clear cache and restart:**
   ```bash
   # Frontend
   rm -rf .next
   npm run dev
   
   # Backend
   find . -name "*.pyc" -delete
   find . -name "__pycache__" -delete
   ```

2. **Reset database:**
   ```bash
   sudo -u postgres psql -c "DROP DATABASE IF EXISTS archivara;"
   sudo -u postgres psql -c "CREATE DATABASE archivara;"
   cd archivara/backend && alembic upgrade head
   ```

## 📖 API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details. 