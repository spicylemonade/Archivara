"""backfill_author_emails_from_submitters

Revision ID: be43c0e6f1da
Revises: e88c8c1fb8e2
Create Date: 2025-10-04 00:00:17.472529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be43c0e6f1da'
down_revision: Union[str, None] = 'e88c8c1fb8e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill author emails from paper submitters where author name matches user full_name
    op.execute("""
        UPDATE authors
        SET email = users.email
        FROM users
        INNER JOIN papers ON papers.submitter_id = users.id
        INNER JOIN paper_authors ON paper_authors.paper_id = papers.id
        WHERE paper_authors.author_id = authors.id
        AND authors.email IS NULL
        AND LOWER(authors.name) = LOWER(users.full_name)
    """)


def downgrade() -> None:
    # No downgrade needed - we don't want to remove emails
    pass
