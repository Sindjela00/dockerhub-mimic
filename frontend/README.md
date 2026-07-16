# Frontend

React SPA for dockerhub-mimic — Explore, Repositories, Organizations, Admin, and
Analytics sections.

## Tech stack

- **React 19** + **React Router 7**
- **Vite 7** (build tool + dev server) with **TypeScript**
- **Tailwind CSS 4**
- **Axios** for API calls, **lucide-react** for icons
- **Vitest** + **React Testing Library** for component tests

## Project layout

```
src/pages/        One folder per route/page
src/components/   Shared, reusable UI components
src/services/     API calls (axios) + data-fetching hooks, grouped by domain
src/context/      React context providers (auth, theme, etc.)
src/lib/api.ts    Configured axios instance — attaches the JWT, handles 401/forced-password-change globally
src/utils/        Small stateless helpers
```

## Running

The frontend talks to the backend over relative `/api` and `/auth` paths — there's no
`API base URL` to configure, because in production nginx routes those paths to the
backend, and in dev Vite's own proxy does the same thing (see `vite.config.ts`).

**Fastest path (recommended):** run everything through Docker Compose from the repo
root, then just open the app — no separate frontend dev server needed:

```
python ../run_env.py start --build
```

**Hot-reload dev server:** keep the backend/db/etc. running via Docker Compose (as
above, or just `docker compose up -d nginx backend`), then run the frontend separately
for fast refresh on save:

```
npm install
npm run dev
```

Vite's dev server proxies `/api/*` to `http://localhost:3000` (i.e. nginx →
backend), so the containerized backend must already be running.

## Tests

```
npm run test              # run once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage (80% threshold on lines/branches/functions/statements)
```

Or via the root wrapper, which runs it the same way CI does:
```
python ../run_env.py test frontend --coverage
```

Per the course spec, only the backend requires unit/integration tests — these frontend
tests exist anyway but aren't graded.

## Linting & building

```
npm run lint
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```
