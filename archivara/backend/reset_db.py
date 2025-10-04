"""One-time script to reset database schema"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.db.base_class import Base

async def reset_database():
    """Drop all tables and recreate schema"""
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print("ERROR: DATABASE_URL not set")
        return False

    # Convert to asyncpg if needed
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    print(f"Connecting to: {db_url[:30]}...")

    engine = create_async_engine(db_url)

    try:
        async with engine.begin() as conn:
            print("Dropping all tables...")
            await conn.run_sync(Base.metadata.drop_all)

            # Also drop alembic_version table so migrations run from scratch
            print("Dropping alembic_version table...")
            await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))

            print("All tables dropped successfully")

        await engine.dispose()
        return True

    except Exception as e:
        print(f"ERROR: Failed to reset database: {e}")
        await engine.dispose()
        return False

if __name__ == "__main__":
    success = asyncio.run(reset_database())
    exit(0 if success else 1)
