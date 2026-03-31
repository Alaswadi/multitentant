# CLAUDE.md — AI Assistant Guide for multitentant

This file provides AI assistants with context about this repository's structure, conventions, and workflows.

---

## Project Overview

A multi-tenant SaaS boilerplate using **schema-per-tenant** PostgreSQL isolation. Each tenant gets a dedicated PostgreSQL schema within a single database. The stack is Docker-native for local development and deployable via Coolify.

---

## Repository Structure

```
multi-tenant-saas/
├── .env.example             # Required environment variables
├── docker-compose.yml       # 3-service stack: db, backend, frontend
├── README.md
├── backend/
│   ├── Dockerfile           # Node 20-alpine, port 3000
│   ├── package.json
│   ├── init.sql             # Creates public.tenants + public.users tables
│   └── src/
│       ├── index.js         # Express app entry point
│       ├── middleware/
│       │   ├── auth.js      # JWT verification + cross-tenant protection
│       │   └── tenant.js    # Tenant identification (subdomain or header)
│       ├── routes/
│       │   ├── auth.js      # POST /api/signup, POST /api/login
│       │   └── dashboard.js # GET/POST /api/dashboard (protected)
│       └── services/
│           └── tenantProvisioner.js  # Schema creation + pg.Pool
└── frontend/
    ├── Dockerfile           # Node 20-alpine, runs vite dev, port 5173
    ├── package.json
    ├── vite.config.js       # allowedHosts: true, injects VITE_API_URL
    └── src/
        ├── main.jsx         # React 18 + react-router-dom v6 entry point
        ├── utils/
        │   └── tenant.js    # Axios instance with auto-headers
        └── pages/
            ├── Landing.jsx
            ├── Signup.jsx
            ├── Login.jsx
            └── Dashboard.jsx
```

---

## Technology Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Backend    | Node.js 20, Express 4                       |
| Database   | PostgreSQL 15                               |
| Auth       | JWT (jsonwebtoken), bcryptjs (10 rounds)    |
| DB Client  | pg (node-postgres), single Pool instance    |
| Frontend   | React 18, react-router-dom v6, Vite 5       |
| HTTP       | Axios (with auto-injected headers)          |
| Dev env    | Docker Compose                              |

---

## Environment Variables

**Backend** (set in `docker-compose.yml` or `.env`):

| Variable       | Default                                     | Notes                              |
|----------------|---------------------------------------------|------------------------------------|
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/saas` | Must point to the db service       |
| `JWT_SECRET`   | `supersecretkey`                            | **Must be changed in production**  |
| `BASE_DOMAIN`  | `localhost`                                 | Used for subdomain extraction      |
| `PORT`         | `3000`                                      |                                    |

**Frontend** (injected at build/start time):

| Variable        | Purpose                              |
|-----------------|--------------------------------------|
| `VITE_API_URL`  | Backend API base URL for axios       |

---

## Database Architecture

### Shared (public) schema — created by `init.sql`:
```sql
public.tenants  (id UUID, slug VARCHAR UNIQUE, name VARCHAR, created_at)
public.users    (id UUID, email VARCHAR, password_hash TEXT, tenant_id UUID FK, created_at)
                UNIQUE(email, tenant_id)
```

### Per-tenant schema — provisioned at signup:
```
Schema name: tenant_{slug_with_underscores}
  e.g., "acme-corp" → schema "tenant_acme_corp"

{schema}.projects  (id UUID, name VARCHAR, description TEXT, created_at)
```

**Key invariant**: Hyphens in slugs become underscores in schema names. This conversion is done in `tenantProvisioner.js`.

---

## Multi-Tenancy Patterns

### 1. Tenant Identification (`middleware/tenant.js`)
Tenant is resolved on **every request** via two fallback mechanisms:
1. **Subdomain** — `acme-corp.example.com` → slug `acme-corp`
2. **`X-Tenant-Slug` header** — used in Docker local dev where subdomains aren't available

Reserved subdomains that bypass tenant resolution: `localhost`, `backend`, `frontend`, `www`, `api`.

Public routes that skip tenant requirement: `/signup`, `/login`, `/`.

### 2. JWT Authentication (`middleware/auth.js`)
- Tokens include `{ userId, email, tenantSlug }`.
- Auth middleware verifies the token's `tenantSlug` matches the request's resolved `tenantSlug`. This prevents cross-tenant token reuse.

### 3. Schema Isolation (`routes/dashboard.js`)
Every authenticated query sets `search_path` to the tenant's schema:
```sql
SET search_path TO tenant_acme_corp, public
```
This ensures all table references resolve to tenant-specific tables, with `public` as fallback.

---

## API Endpoints

| Method | Path                     | Auth | Description                            |
|--------|--------------------------|------|----------------------------------------|
| GET    | `/`                      | No   | Health check                           |
| POST   | `/api/signup`            | No   | Create tenant + owner user             |
| POST   | `/api/login`             | No   | Authenticate, return JWT               |
| GET    | `/api/dashboard`         | Yes  | Fetch tenant, user, projects           |
| POST   | `/api/dashboard/projects`| Yes  | Create a project in tenant schema      |

All error responses follow: `{ "error": "message" }`.

---

## Frontend Conventions

- **Routing**: react-router-dom v6 (`createBrowserRouter` / `<Routes>`).
- **Auth state**: JWT token and `tenantSlug` stored in `localStorage`.
- **API calls**: Always use the axios instance from `src/utils/tenant.js`. It automatically injects `X-Tenant-Slug` and `Authorization: Bearer {token}` headers.
- **Logout**: Clear `localStorage` and redirect to `/login`.
- **Unauthorized responses (401)**: Redirect to `/login`.

---

## Development Workflow

### Start full stack
```bash
cd multi-tenant-saas
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5432 (postgres/postgres)

### Access the database
```bash
docker compose exec multi-tenant-saas-db-1 psql -U postgres -d saas
```

Useful queries:
```sql
-- List all tenants
SELECT * FROM public.tenants;

-- List tenant schemas
SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';

-- Inspect a tenant's projects
SELECT * FROM tenant_acme_corp.projects;
```

### Backend only (no Docker)
```bash
cd multi-tenant-saas/backend
npm install
npm run dev    # nodemon, auto-reload
```

### Frontend only (no Docker)
```bash
cd multi-tenant-saas/frontend
npm install
VITE_API_URL=http://localhost:3000 npm run dev
```

---

## Adding New Features

### Adding a new tenant-scoped table
1. Add `CREATE TABLE IF NOT EXISTS {schema}.your_table (...)` in `tenantProvisioner.js` inside `provisionTenantSchema()`.
2. Add routes in `routes/dashboard.js` (or a new route file). Always set `search_path` before querying.
3. Register the route in `src/index.js`.

### Adding a new API route
1. Create `src/routes/yourroute.js`.
2. Apply `authMiddleware` for protected routes.
3. Mount in `src/index.js`: `app.use('/api/yourroute', require('./routes/yourroute'))`.

### Adding a new frontend page
1. Create `src/pages/YourPage.jsx`.
2. Add a route in `src/main.jsx`.
3. Use the axios instance from `src/utils/tenant.js` for all API calls.

---

## Code Conventions

- **Comments**: Key architectural decisions are documented with `// WHY:` prefix. Preserve these when refactoring.
- **Error format**: All API errors return `{ "error": "..." }` with appropriate HTTP status codes (400, 401, 403, 404, 500).
- **Slug format**: Tenant slugs are lowercase with hyphens (e.g., `acme-corp`). Schema names use underscores (`tenant_acme_corp`).
- **UUID primary keys**: All tables use `gen_random_uuid()` as primary key default.
- **No ORM**: Raw SQL via `pg` Pool. Keep queries explicit; avoid abstracting behind an ORM unless one is introduced.
- **No tests yet**: No test framework is configured. Manual testing is the current approach (see README for test workflow).

---

## Security Notes

- `JWT_SECRET` **must** be a strong random string in production — the default `supersecretkey` is insecure.
- The cross-tenant check in `auth.js` is critical — do not remove it.
- `trust proxy` is enabled (`app.set('trust proxy', true)`) to support Nginx/Traefik/Coolify deployments.
- CORS is configured in `src/index.js` — review allowed origins before deploying.
- No rate limiting or input validation is currently implemented — consider adding for production.

---

## Deployment (Coolify)

- `VITE_API_URL` must be set to the public backend URL before the frontend builds.
- `allowedHosts: true` in `vite.config.js` is required for proxy compatibility — do not change it.
- Set a strong `JWT_SECRET` and correct `BASE_DOMAIN` in environment variables.
- The backend's `trust proxy` setting is already enabled for reverse-proxy environments.
