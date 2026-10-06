#!/bin/sh
set -e

echo "Applying database migrations..."
# Databases created earlier with create_all() have tables but no alembic_version:
# mark them as being at the initial schema so only newer migrations run.
NEEDS_STAMP=$(python -c "
from sqlalchemy import inspect
from app.core.database import engine
tables = inspect(engine).get_table_names()
print('yes' if 'analyses' in tables and 'alembic_version' not in tables else 'no')
")
if [ "$NEEDS_STAMP" = "yes" ]; then
    echo "Existing database without migration history — stamping initial schema."
    alembic stamp 0001
fi
alembic upgrade head

echo "Creating accounts..."
python -m app.utils.create_admin || true

echo "Starting server..."
# Hosts such as Render pass the port to listen on in $PORT
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips="*"
