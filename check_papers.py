#!/usr/bin/env python3

import asyncio
from app.database import get_db
from app.models.paper import Paper
from sqlalchemy import select

async def check_papers():
    async for db in get_db():
        result = await db.execute(select(Paper).limit(5))
        papers = result.scalars().all()
        print(f"Found {len(papers)} papers:")
        for paper in papers:
            print(f'Paper {paper.id}:')
            print(f'  categories={paper.categories}')
            print(f'  generation_method={paper.generation_method}')
            print(f'  title={paper.title}')
            print()
        break

if __name__ == "__main__":
    asyncio.run(check_papers()) 