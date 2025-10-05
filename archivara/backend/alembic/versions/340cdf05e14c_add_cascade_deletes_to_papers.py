"""add_cascade_deletes_to_papers

Revision ID: 340cdf05e14c
Revises: b808bc478ba0
Create Date: 2025-10-04 18:11:11.574756

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '340cdf05e14c'
down_revision: Union[str, None] = 'b808bc478ba0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add CASCADE delete to paper_authors association table
    op.execute("""
        ALTER TABLE paper_authors
        DROP CONSTRAINT IF EXISTS paper_authors_paper_id_fkey,
        ADD CONSTRAINT paper_authors_paper_id_fkey
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    """)

    op.execute("""
        ALTER TABLE paper_authors
        DROP CONSTRAINT IF EXISTS paper_authors_author_id_fkey,
        ADD CONSTRAINT paper_authors_author_id_fkey
        FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
    """)

    # Add CASCADE delete to submission_attempts
    op.execute("""
        ALTER TABLE submission_attempts
        DROP CONSTRAINT IF EXISTS submission_attempts_paper_id_fkey,
        ADD CONSTRAINT submission_attempts_paper_id_fkey
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    """)

    # Add CASCADE delete to paper_flags
    op.execute("""
        ALTER TABLE paper_flags
        DROP CONSTRAINT IF EXISTS paper_flags_paper_id_fkey,
        ADD CONSTRAINT paper_flags_paper_id_fkey
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    """)


def downgrade() -> None:
    # Revert CASCADE to RESTRICT (default behavior)
    op.execute("""
        ALTER TABLE paper_authors
        DROP CONSTRAINT IF EXISTS paper_authors_paper_id_fkey,
        ADD CONSTRAINT paper_authors_paper_id_fkey
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    """)

    op.execute("""
        ALTER TABLE paper_authors
        DROP CONSTRAINT IF EXISTS paper_authors_author_id_fkey,
        ADD CONSTRAINT paper_authors_author_id_fkey
        FOREIGN KEY (author_id) REFERENCES authors(id)
    """)

    op.execute("""
        ALTER TABLE submission_attempts
        DROP CONSTRAINT IF EXISTS submission_attempts_paper_id_fkey,
        ADD CONSTRAINT submission_attempts_paper_id_fkey
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    """)

    op.execute("""
        ALTER TABLE paper_flags
        DROP CONSTRAINT IF EXISTS paper_flags_paper_id_fkey,
        ADD CONSTRAINT paper_flags_paper_id_fkey
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    """)
