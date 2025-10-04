"""add_moderation_system

Revision ID: 8e9a6f1d339d
Revises: 5f8c68f20752
Create Date: 2025-10-03 19:18:44.929733

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e9a6f1d339d'
down_revision: Union[str, None] = '5f8c68f20752'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add moderation enums
    op.execute("CREATE TYPE baselinestatus AS ENUM ('pass', 'warn', 'reject', 'pending')")
    op.execute("CREATE TYPE visibilitytier AS ENUM ('frontpage', 'main', 'raw', 'hidden')")

    # Add moderation fields to papers table
    op.add_column('papers', sa.Column('baseline_status', sa.Enum('pass', 'warn', 'reject', 'pending', name='baselinestatus'), nullable=False, server_default='pending'))
    op.add_column('papers', sa.Column('baseline_checks', sa.JSON(), nullable=True))
    op.add_column('papers', sa.Column('quality_score', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('papers', sa.Column('needs_review', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('papers', sa.Column('red_flags', sa.JSON(), nullable=True))
    op.add_column('papers', sa.Column('community_upvotes', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('papers', sa.Column('community_downvotes', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('papers', sa.Column('flag_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('papers', sa.Column('visibility_tier', sa.Enum('frontpage', 'main', 'raw', 'hidden', name='visibilitytier'), nullable=False, server_default='raw'))
    op.add_column('papers', sa.Column('moderation_notes', sa.Text(), nullable=True))

    # Create paper_votes table
    op.create_table(
        'paper_votes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('paper_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('vote', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_paper_votes_paper_id', 'paper_votes', ['paper_id'])
    op.create_index('ix_paper_votes_user_id', 'paper_votes', ['user_id'])

    # Create paper_flags table
    op.create_table(
        'paper_flags',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('paper_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('ix_paper_flags_paper_id', 'paper_flags', ['paper_id'])
    op.create_index('ix_paper_flags_user_id', 'paper_flags', ['user_id'])


def downgrade() -> None:
    # Drop tables
    op.drop_index('ix_paper_flags_user_id', 'paper_flags')
    op.drop_index('ix_paper_flags_paper_id', 'paper_flags')
    op.drop_table('paper_flags')

    op.drop_index('ix_paper_votes_user_id', 'paper_votes')
    op.drop_index('ix_paper_votes_paper_id', 'paper_votes')
    op.drop_table('paper_votes')

    # Drop columns from papers
    op.drop_column('papers', 'moderation_notes')
    op.drop_column('papers', 'visibility_tier')
    op.drop_column('papers', 'flag_count')
    op.drop_column('papers', 'community_downvotes')
    op.drop_column('papers', 'community_upvotes')
    op.drop_column('papers', 'red_flags')
    op.drop_column('papers', 'needs_review')
    op.drop_column('papers', 'quality_score')
    op.drop_column('papers', 'baseline_checks')
    op.drop_column('papers', 'baseline_status')

    # Drop enums
    op.execute("DROP TYPE visibilitytier")
    op.execute("DROP TYPE baselinestatus")
