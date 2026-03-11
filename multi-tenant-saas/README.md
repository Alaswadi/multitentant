# Multi-tenant SaaS Boilerplate (Schema-per-Tenant)

This boilerplate demonstrates a robust multi-tenant architecture using Node.js, PostgreSQL, and React, fully containerized with Docker.

## Features
- **Schema Isolation**: Every tenant gets their own PostgreSQL schema (`tenant_acme_corp`).
- **Provisioning**: Automated schema and table creation on signup.
- **Tenant Identification**: Supports both real subdomains (e.g., `acme.lvh.me`) and a header fallback (`X-Tenant-Slug`) for local development.
- **Dockerized**: 3-tier architecture (DB, API, Web) managed via Docker Compose.

## Quick Start

1. **Spin up the stack**:
   ```bash
   docker-compose up --build
   ```

2. **Access the Application**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:3000](http://localhost:3000)

## How to Test

### 1. Signup
- Visit [http://localhost:5173/signup](http://localhost:5173/signup).
- Enter "Acme Corp", email, and password.
- You will see your tenant slug (e.g., `acme-corp`).

### 2. Login
- Go to [http://localhost:5173/login](http://localhost:5173/login).
- Enter the slug `acme-corp` and your credentials.
- You are now logged into your dedicated workspace.

### 3. Verify Isolation
- Create a project in the dashboard.
- Sign up with a different company (e.g., "Beta Inc").
- Log in to `beta-inc` and observe that you cannot see Acme Corp's projects.

### 4. Database Inspection
Connect to the database container:
```bash
docker exec -it multi-tenant-saas-db-1 psql -U postgres -d saas
```
Run these commands:
- `\dn` (List all schemas - you should see `tenant_acme_corp`).
- `SET search_path TO tenant_acme_corp;`
- `SELECT * FROM projects;` (View this tenant's private data).

## Real Subdomain Testing
You can use `lvh.me` which points to `127.0.0.1`.
Visit `http://acme-corp.lvh.me:5173`. The application will automatically detect the tenant from the URL!

## Deployment Notes (e.g. Coolify)

When deploying to production environments like Coolify:

1. **Vite Host**: Vite 6+ requires `server.allowedHosts` to be set. We've added a [vite.config.js](file:///c:/Users/fadia/Documents/augment-projects/multitentant/multi-tenant-saas/frontend/vite.config.js) that allows all hosts.
2. **Proxy Headers**: Behind a load balancer/proxy (like Coolify's Traefik), Express needs `app.set('trust proxy', true)` to correctly read `req.hostname` and `req.ip`. This is enabled in [index.js](file:///c:/Users/fadia/Documents/augment-projects/multitentant/multi-tenant-saas/backend/src/index.js).
3. **Environment Variables**:
   - Set `VITE_API_URL` in your frontend container to your public backend URL (e.g., `https://api.phishsimulator.com`).
   - Set `DATABASE_URL` and `JWT_SECRET` in your backend container.

---

**Code Style**: This project uses clean, modular code with `// WHY:` comments explaining key architectural decisions.
