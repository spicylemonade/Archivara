"""add_verification_token_fields_to_user

Revision ID: e4dbf417a6d6
Revises: 8e9a6f1d339d
Create Date: 2025-10-03 20:09:31.700829

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4dbf417a6d6'
down_revision: Union[str, None] = '8e9a6f1d339d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add verification_token and verification_token_expires columns
    op.add_column('users', sa.Column('verification_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_token_expires', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove verification_token and verification_token_expires columns
    op.drop_column('users', 'verification_token_expires')
    op.drop_column('users', 'verification_token')
