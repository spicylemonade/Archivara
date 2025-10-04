"""fix_all_author_ordering

Revision ID: 09026e438ba3
Revises: be43c0e6f1da
Create Date: 2025-10-04 00:09:44.968440

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09026e438ba3'
down_revision: Union[str, None] = 'be43c0e6f1da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix ordering for all existing papers - prioritize submitter as first author
    # First, set submitter as order 0 if they are an author
    op.execute("""
        WITH submitter_authors AS (
            SELECT
                pa.paper_id,
                pa.author_id,
                ROW_NUMBER() OVER (PARTITION BY pa.paper_id ORDER BY pa.author_id) as rn
            FROM paper_authors pa
            INNER JOIN papers p ON p.id = pa.paper_id
            INNER JOIN authors a ON a.id = pa.author_id
            INNER JOIN users u ON u.id = p.submitter_id
            WHERE LOWER(a.name) = LOWER(u.full_name)
        )
        UPDATE paper_authors
        SET "order" = -1
        FROM submitter_authors sa
        WHERE paper_authors.paper_id = sa.paper_id
        AND paper_authors.author_id = sa.author_id
        AND sa.rn = 1
    """)

    # Then set order for all other authors
    op.execute("""
        WITH numbered_authors AS (
            SELECT
                paper_id,
                author_id,
                ROW_NUMBER() OVER (PARTITION BY paper_id ORDER BY
                    CASE WHEN "order" = -1 THEN 0 ELSE 1 END,
                    author_id
                ) - 1 as new_order
            FROM paper_authors
        )
        UPDATE paper_authors
        SET "order" = na.new_order
        FROM numbered_authors na
        WHERE paper_authors.paper_id = na.paper_id
        AND paper_authors.author_id = na.author_id
    """)


def downgrade() -> None:
    # Reset all orders to 0
    op.execute("UPDATE paper_authors SET \"order\" = 0")
