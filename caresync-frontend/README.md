# CareSync Frontend

React + TypeScript SPA for the ASC Vendor Management Portal.

## Setup

```bash
npm install
cp .env.example .env.local   # set VITE_API_URL to your backend
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `npm run type-check` | TypeScript check |
| `npm test` | Run tests |

## Structure

```
src/
├── api/          Axios client + per-module API services
├── components/   Reusable UI (Layout, common/)
├── context/      React contexts (Auth, etc.)
├── hooks/        Custom hooks
├── pages/        Route-level page components
├── types/        Shared TypeScript types
└── utils/        Constants and helper functions
```
