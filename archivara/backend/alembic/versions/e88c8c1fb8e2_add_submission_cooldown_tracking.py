"""add_submission_cooldown_tracking

Revision ID: e88c8c1fb8e2
Revises: 3776b790c149
Create Date: 2025-10-03 23:35:06.852484

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e88c8c1fb8e2'
down_revision: Union[str, None] = '3776b790c149'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create submission_attempts table
    op.create_table(
        'submission_attempts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('paper_id', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),  # 'accepted', 'rejected'
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_submission_attempts_user_id', 'submission_attempts', ['user_id'])
    op.create_index('ix_submission_attempts_created_at', 'submission_attempts', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_submission_attempts_created_at')
    op.drop_index('ix_submission_attempts_user_id')
    op.drop_table('submission_attempts')
