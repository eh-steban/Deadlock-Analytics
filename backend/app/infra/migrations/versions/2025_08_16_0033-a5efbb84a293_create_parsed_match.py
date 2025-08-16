"""create parsed match payload

Revision ID: a5efbb84a293
Revises: 8cfb023f5d33
Create Date: 2025-08-16 00:33:10.537867+00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a5efbb84a293'
down_revision: Union[str, Sequence[str], None] = '8cfb023f5d33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.create_table(
        'parsedmatch',
        sa.Column('match_id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('schema_version', sa.Integer(), nullable=False, default=1),
        sa.Column('payload_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('etag', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('match_id', 'schema_version', name='uq_match_id_schema_version')
    )

def downgrade():
    op.drop_table('parsedmatch')
