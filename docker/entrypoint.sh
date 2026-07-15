#!/bin/sh
set -e

echo "Creating database tables..."
python -c "
import app.models
from app.core.database import engine, Base
Base.metadata.create_all(bind=engine)
print('Tables ready.')
"

echo "Seeding demo accounts..."
python -m app.utils.create_admin || true

echo "Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
