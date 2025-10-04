"""fix_enum_values_to_lowercase

Revision ID: 3776b790c149
Revises: e4dbf417a6d6
Create Date: 2025-10-03 21:35:29.710486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3776b790c149'
down_revision: Union[str, None] = 'e4dbf417a6d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop and recreate enum types with lowercase values

    # PaperStatus
    op.execute("ALTER TABLE papers ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TYPE paperstatus RENAME TO paperstatus_old")
    op.execute("CREATE TYPE paperstatus AS ENUM ('draft', 'submitted', 'published', 'rejected', 'retracted')")
    op.execute("ALTER TABLE papers ALTER COLUMN status TYPE paperstatus USING lower(status::text)::paperstatus")
    op.execute("ALTER TABLE papers ALTER COLUMN status SET DEFAULT 'submitted'")
    op.execute("DROP TYPE paperstatus_old")

    # BaselineStatus
    op.execute("ALTER TABLE papers ALTER COLUMN baseline_status DROP DEFAULT")
    op.execute("ALTER TYPE baselinestatus RENAME TO baselinestatus_old")
    op.execute("CREATE TYPE baselinestatus AS ENUM ('pass', 'warn', 'reject', 'pending')")
    op.execute("ALTER TABLE papers ALTER COLUMN baseline_status TYPE baselinestatus USING lower(baseline_status::text)::baselinestatus")
    op.execute("ALTER TABLE papers ALTER COLUMN baseline_status SET DEFAULT 'pending'")
    op.execute("DROP TYPE baselinestatus_old")

    # VisibilityTier
    op.execute("ALTER TABLE papers ALTER COLUMN visibility_tier DROP DEFAULT")
    op.execute("ALTER TYPE visibilitytier RENAME TO visibilitytier_old")
    op.execute("CREATE TYPE visibilitytier AS ENUM ('frontpage', 'main', 'raw', 'hidden')")
    op.execute("ALTER TABLE papers ALTER COLUMN visibility_tier TYPE visibilitytier USING lower(visibility_tier::text)::visibilitytier")
    op.execute("ALTER TABLE papers ALTER COLUMN visibility_tier SET DEFAULT 'raw'")
    op.execute("DROP TYPE visibilitytier_old")


def downgrade() -> None:
    # Revert to uppercase values

    # PaperStatus
    op.execute("ALTER TYPE paperstatus RENAME TO paperstatus_old")
    op.execute("CREATE TYPE paperstatus AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED', 'REJECTED', 'RETRACTED')")
    op.execute("ALTER TABLE papers ALTER COLUMN status TYPE paperstatus USING status::text::paperstatus")
    op.execute("DROP TYPE paperstatus_old")

    # BaselineStatus
    op.execute("ALTER TYPE baselinestatus RENAME TO baselinestatus_old")
    op.execute("CREATE TYPE baselinestatus AS ENUM ('PASS', 'WARN', 'REJECT', 'PENDING')")
    op.execute("ALTER TABLE papers ALTER COLUMN baseline_status TYPE baselinestatus USING baseline_status::text::baselinestatus")
    op.execute("DROP TYPE baselinestatus_old")

    # VisibilityTier
    op.execute("ALTER TYPE visibilitytier RENAME TO visibilitytier_old")
    op.execute("CREATE TYPE visibilitytier AS ENUM ('FRONTPAGE', 'MAIN', 'RAW', 'HIDDEN')")
    op.execute("ALTER TABLE papers ALTER COLUMN visibility_tier TYPE visibilitytier USING visibility_tier::text::visibilitytier")
    op.execute("DROP TYPE visibilitytier_old")
