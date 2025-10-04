"""add_oauth_fields_to_user

Revision ID: 5f8c68f20752
Revises: 70ad47f758d3
Create Date: 2025-10-03 19:07:26.385747

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f8c68f20752'
down_revision: Union[str, None] = '70ad47f758d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make hashed_password nullable for OAuth users
    op.alter_column('users', 'hashed_password', nullable=True)

    # Add OAuth fields
    op.add_column('users', sa.Column('oauth_provider', sa.String(), nullable=True))
    op.add_column('users', sa.Column('oauth_sub', sa.String(), nullable=True))
    op.add_column('users', sa.Column('picture', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove OAuth fields
    op.drop_column('users', 'picture')
    op.drop_column('users', 'oauth_sub')
    op.drop_column('users', 'oauth_provider')

    # Make hashed_password non-nullable again
    op.alter_column('users', 'hashed_password', nullable=False)
