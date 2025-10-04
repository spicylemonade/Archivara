"""add_updated_at_to_submission_attempts

Revision ID: b808bc478ba0
Revises: 09026e438ba3
Create Date: 2025-10-04 16:54:28.693952

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b808bc478ba0'
down_revision: Union[str, None] = '09026e438ba3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add updated_at column to submission_attempts table
    op.add_column('submission_attempts',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )


def downgrade() -> None:
    # Remove updated_at column from submission_attempts table
    op.drop_column('submission_attempts', 'updated_at')
