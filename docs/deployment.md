# Deployment

## Required configuration

Backend variables are documented in `backend/.env.example`. Frontend variables are in `frontend/.env.example`.

Set:

- `VITE_SITE_URL` to the final HTTPS origin.
- `VITE_GA_MEASUREMENT_ID` only after creating the production GA4 property.
- Backend secrets, database URL, payment and AI provider variables through the deployment secret manager.

## Build

Install dependencies in `backend` and `frontend`, generate Prisma Client, apply the database schema, run tests, then run the Vite production build.

## Web server rules

- Proxy `/api/v1/*` and Socket.IO to the backend.
- Serve static assets with immutable cache headers.
- Return `index.html` for public frontend URLs.
- Do not rewrite missing asset paths to HTML.
- Serve `robots.txt` and `sitemap.xml` from the public root.

## Operations

Monitor health endpoint, server errors, payment webhook failures, rate-limit events and unresolved contact inquiries. Back up the database before schema deployment.

