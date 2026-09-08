# MVMCareSync — ASC Vendor Management Portal

Internal operations tool for managing vendor coverage at Ambulatory Surgery Centers. Replaces the phone/spreadsheet workflow with a structured case request process: create a request, assign a vendor, confirm attendance, and keep a full audit trail.

---

## Stack

| Layer       | Technology                                              |
|-------------|----------------------------------------------------------|
| Backend     | Python 3.11, Django 4.2, Django REST Framework           |
| Auth        | SimpleJWT (access 8h, refresh 7d)                        |
| Task queue  | Celery 5 + Redis 7                                       |
| Database    | PostgreSQL 15                                            |
| Email       | Mailtrap REST API (dev sandbox + production)             |
| Teams       | MS Teams incoming webhook (optional)                     |
| Frontend    | React 18, TypeScript, Vite 5, Tailwind CSS               |
| State       | TanStack Query, React Hook Form, Zod                     |
| Calendar    | react-big-calendar                                       |

---

## Quick Start

Requires Docker and Docker Compose.

```bash
cp .env.example .env          # review defaults, fill in real values for prod
make build                     # build all images
make up                        # start db, redis, backend, frontend, worker, beat
make seed                      # first-time only — seed facilities, vendors, users
```

App: **http://localhost:3000** — API: **http://localhost:8000/api/v1/**

Default credentials after seeding:

| Username       | Password    | Role        |
|----------------|-------------|-------------|
| `admin`        | `Admin123!` | Admin       |
| `coordinator1` | `Coord123!` | Coordinator |
| `staff1`       | `Staff123!` | Staff       |
| `readonly1`    | `Read123!`  | Read-only   |

---

## Project Structure

```
MVMCareSync/
├── caresync-backend/          Django REST API
│   ├── apps/
│   │   ├── users/             Auth, profile, user management
│   │   ├── facilities/        ASC facility CRUD
│   │   ├── vendors/           Vendor + service type CRUD
│   │   ├── case_requests/     Request lifecycle, coverage rules, matching
│   │   ├── notifications/     Email outbox log
│   │   └── common/            Permissions, email backend, pagination
│   ├── caresync/
│   │   └── settings/          base / development / production
│   └── requirements/
├── caresync-frontend/         React SPA
│   └── src/
│       ├── api/               Axios API modules
│       ├── components/        Reusable UI components
│       ├── pages/             Route-level pages
│       ├── context/           Auth context
│       └── types/             TypeScript types
├── docker-compose.yml
├── Makefile
├── ARCHITECTURE.md            Full schema, API reference, role matrix
└── PLAYBOOK.md                Operational runbook and use cases
```

---

## Make Targets

```bash
make build    # Build all Docker images
make up       # Start all services with logs
make down     # Stop and remove containers
make seed     # Seed the database (run once after first up)
make shell    # Shell into the backend container
```

---

## Roles

| Role        | What they can do                                         |
|-------------|----------------------------------------------------------|
| Admin       | Everything — including user management                   |
| Coordinator | Full request lifecycle + manage vendors and facilities   |
| Staff       | Create and submit requests                               |
| Read-only   | View only — no create, edit, or delete                   |

Vendors do not have portal access. They receive request, confirmation, cancellation, and reminder emails automatically.

---

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full database schema, API endpoint reference, and permission matrix.  
See [PLAYBOOK.md](PLAYBOOK.md) for the operational runbook and step-by-step use cases.
