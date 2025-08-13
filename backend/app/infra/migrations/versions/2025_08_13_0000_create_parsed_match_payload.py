"""
Alembic migration to create parsed_match_payload table
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '2025_08_13_0000'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'parsedmatchpayload',
        sa.Column('match_id', sa.String(), primary_key=True, nullable=False),
        sa.Column('schema_version', sa.Integer(), nullable=False, default=1),
        sa.Column('payload_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('etag', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('match_id', 'schema_version', name='uq_match_id_schema_version')
    )

def downgrade():
    op.drop_table('parsedmatchpayload')
