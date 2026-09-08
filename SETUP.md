# MVMCareSync — Setup Guide

---

## Docker Setup (recommended)

The fastest way to run the full stack. Requires Docker and Docker Compose.

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env if needed — defaults work for local development

# 2. Build images
make build

# 3. Start all services
make up
# Starts: PostgreSQL, Redis, Django backend, Vite frontend, Celery worker, Celery beat

# 4. First-time database setup (separate terminal)
make seed
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Django admin: http://localhost:8000/admin/

After seeding, log in with `admin` / `Admin123!`.

---

## Services

| Service    | Image                | Role                                 |
|------------|----------------------|--------------------------------------|
| `db`       | postgres:15-alpine   | Primary database                     |
| `redis`    | redis:7-alpine       | Celery broker and result backend     |
| `backend`  | ./caresync-backend   | Django dev server on port 8000       |
| `frontend` | ./caresync-frontend  | Vite dev server on port 3000         |
| `worker`   | ./caresync-backend   | Celery worker — processes email tasks|
| `beat`     | ./caresync-backend   | Celery beat — scheduled reminders    |

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed. Key variables:

| Variable              | Default                      | Notes                              |
|-----------------------|------------------------------|------------------------------------|
| `SECRET_KEY`          | placeholder                  | Change for any shared environment  |
| `POSTGRES_PASSWORD`   | `caresync_dev`               | Local dev default                  |
| `MAILTRAP_API_TOKEN`  | sandbox token                | Replace with production token      |
| `TEAMS_WEBHOOK_URL`   | empty                        | Optional — Teams alerts            |
| `FRONTEND_URL`        | `http://localhost:3000`      | Used in password reset emails      |
| `JWT_ACCESS_TOKEN_LIFETIME_HOURS` | `8`            |                                    |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7`            |                                    |

---

## Make Targets

```bash
make build    # Build all Docker images
make up       # Start all services (foreground with logs)
make down     # Stop and remove containers
make seed     # Seed database with sample data
make shell    # Open a shell in the running backend container
```

---

## Manual Backend Commands

Via the running container:

```bash
make shell

# Inside the container:
python manage.py migrate
python manage.py seed_data
python manage.py seed_data --clear    # wipe and re-seed
python manage.py createsuperuser
python manage.py shell
pytest
```

---

## Local Dev (without Docker)

If you prefer to run services directly:

**Backend:**

```bash
cd caresync-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements/development.txt

# Set environment variables or create a .env file
export DJANGO_SETTINGS_MODULE=caresync.settings.development
export DATABASE_URL=sqlite:///db.sqlite3   # or point to local Postgres

python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

**Frontend:**

```bash
cd caresync-frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8000` via `vite.config.ts`.

---

## Troubleshooting

**Backend container exits immediately** — check logs with `docker compose logs backend`. Most common cause is a missing or malformed `.env` file.

**`seed_data` fails with duplicate key** — the database was already seeded. Run `make shell` then `python manage.py seed_data --clear` to reset.

**Emails not arriving** — confirm `MAILTRAP_API_TOKEN` in `.env`. In sandbox mode all emails land in the Mailtrap inbox, not the real recipient.

**401 on all API calls after login** — JWT access token lifetime may have expired. Log out and back in. The Axios interceptor handles silent refresh automatically, but it requires the refresh token to still be valid.
