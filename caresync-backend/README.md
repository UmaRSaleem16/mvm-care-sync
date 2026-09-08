# CareSync Backend

Django REST API for the ASC Vendor Management Portal.

## Setup

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements/development.txt
cp .env.example .env   # edit as needed
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
python manage.py runserver
```

## API Base URL

```
http://localhost:8000/api/v1/
```

## Auth

JWT — obtain tokens at `/api/v1/auth/token/`, refresh at `/api/v1/auth/token/refresh/`.

## Apps

| App | Purpose |
|-----|---------|
| `users` | Internal staff accounts and roles |
| `vendors` | Vendor database and service types |
| `facilities` | ASC facility records |
| `case_requests` | Case coverage requests, status history |
| `notifications` | Email logs and internal notifications |
| `common` | Shared base models and utilities |

## Environment

See `.env.example` for all configurable settings.
