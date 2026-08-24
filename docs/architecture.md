# Architecture

## Runtime

- Frontend: React 18, Vite, Zustand, Axios, Framer Motion and Tailwind utilities.
- Backend: Express, Prisma, SQLite, JWT, Zod, Redis-compatible caching and Socket.IO.
- API namespace: `/api/v1`.

## Frontend boundaries

- `App.jsx` owns route resolution, history state and cross-page booking context.
- `utils/siteRoutes.js` is the single source of truth for public paths.
- `components/common/SeoManager.jsx` owns metadata and JSON-LD.
- Page modules own their data fetching and presentation.
- Zustand stores own authenticated and Admin application state.

## Backend boundaries

- Routes validate transport input and apply authorization.
- Controllers translate HTTP requests and responses.
- Services own business logic and database operations.
- Prisma owns persistence and relations.

## Deployment routing

The web server must return `index.html` for unknown public frontend paths while continuing to route `/api/v1/*` to Express. The React route resolver then renders the correct page or custom 404.

