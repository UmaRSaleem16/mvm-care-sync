#!/bin/sh
set -e

echo "Waiting for database..."
python -c "
import time, os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'caresync.settings.development')
django.setup()
from django.db import connection
for i in range(30):
    try:
        connection.ensure_connection()
        print('Database ready.')
        break
    except Exception:
        print(f'Attempt {i+1}/30 — retrying in 2s...')
        time.sleep(2)
else:
    print('Could not connect to database after 30 attempts.')
    exit(1)
"

echo "Running migrations..."
python manage.py migrate --noinput

# Workers don't serve HTTP so they don't need static files
if [ "${COLLECT_STATIC:-1}" = "1" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --verbosity 0
fi

exec "$@"
