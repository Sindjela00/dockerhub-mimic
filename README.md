# dockerhub-mimic

A simplified DockerHub — user/organization-owned Docker image repositories, a self-hosted
container registry with JWT-backed push/pull authorization, and an Elasticsearch-powered
admin analytics console for searching application logs.

## Features

- **Accounts & roles** — self-registration, JWT login, three roles (User, Administrator,
  SuperAdmin). A super-administrator account is generated on first run (see below).
- **Repositories** — personal or organization-owned, public or private, with tag
  management. Tags are added the same way as on the real DockerHub: `docker push`.
- **Organizations** — teams, per-team-per-repository permissions (`read-only` /
  `read+write` / `admin`), member invites by email.
- **Explore** — search public repositories, filter by badge (Docker Official Image,
  Verified Publisher, Sponsored OSS), star repositories you don't own.
- **Admin** — official repositories, badge assignment, and an Analytics section that
  searches application logs with an `AND`/`OR`/`NOT` query language backed by Elasticsearch.
- **Real `docker` CLI compatibility** — `docker login`, `docker push`, `docker pull` all
  work against the bundled registry; no custom client needed.

## Architecture

Eight containers, orchestrated by a single `docker-compose.yml`:

| Container | Role |
|---|---|
| `nginx` | Reverse proxy — the only container with a published host port |
| `frontend` | React SPA, served by `serve` |
| `backend` | ASP.NET Core API |
| `db` | PostgreSQL |
| `mem-cache` | Redis — caches the docker-login → registry-token bridge credential |
| `registry` | Docker Registry v2, JWT token-auth backed by the backend |
| `elasticsearch` | Log storage/search for the Analytics section |
| `filebeat` | Ships the backend's log files into Elasticsearch |

Request flow: the `docker` CLI and the browser both only ever talk to `nginx`, which
routes `/api/*` and `/auth/*` to the backend, `/v2/*` to the registry, and everything
else to the frontend.

## Quickstart

1. **Prerequisites**: Docker Desktop (or Docker Engine + Compose v2), Python 3.9+.
2. **Configure environment**:
   ```
   cp .env.example .env
   ```
   Fill in real values, especially `POSTGRES_PASSWORD` and `JWT_KEY`. See the comments
   in `.env.example` for what each key does.
3. **Registry signing key**: the registry validates JWTs issued by the backend using a
   key pair under `deploy/registry/`. If you don't already have
   `deploy/registry/registry-private.pem` (it's gitignored — not meant to be committed),
   see [`deploy/README.md`](deploy/README.md) for how to generate one. Without it, the
   registry container will fail to verify `docker login`/`push` tokens.
4. **Start everything**:
   ```
   python run_env.py start --build
   ```
5. **Log in as super-administrator**: once the stack is up, the backend generates a
   super-admin account on first run and writes its one-time password to
   `./deploy/secrets/super-admin-password.txt` on the host. Log in at
   `http://localhost:3000` with username `superadmin` and that password — you'll be
   required to change it before you can use the rest of the system. (The file is only
   regenerated if no super-administrator account exists yet in the database.)

From here, register a regular user, create a repository, and try:
```
docker login localhost:3000
docker tag some-image:latest localhost:3000/<your-username>/<repo-name>:v1
docker push localhost:3000/<your-username>/<repo-name>:v1
```
(The repository must already exist in the app — created via the UI or `POST
/api/repositories` — before you can push to it; the registry token endpoint only grants
`push` scope to repositories the caller already has rights to.)

## Environment management (`run_env.py`)

`run_env.py` wraps Docker Compose with the commands you'll actually use day to day —
run `python run_env.py --help` for the full list with examples. Highlights:

| Command | What it does |
|---|---|
| `start [--build]` | Start the whole stack (optionally rebuilding images first) |
| `stop` / `down [--volumes]` | Stop services, or stop and remove containers (`--volumes` also wipes data — asks for confirmation) |
| `restart [service]` | Restart one service or everything |
| `logs [service] [-f]` | Tail logs, optionally following |
| `status` | Show what's running |
| `build [service]` | Build (or rebuild) images |
| `test [backend\|frontend] [--coverage]` | Run the test suite(s), the same way CI does |
| `coverage-report` | Generate an HTML coverage report from the last test run |
| `exec <service> <cmd>` | Run a command inside a running container |
| `clean` | Full teardown — containers, images, and volumes (asks for confirmation) |

## Development

For fast iteration you don't need to rebuild containers on every change:

- **Backend**: see [`backend/README.md`](backend/README.md) for running the API directly
  with `dotnet run` against the containerized database.
- **Frontend**: see [`frontend/README.md`](frontend/README.md) for running the Vite dev
  server with hot reload against the containerized backend.

## Testing

- **Backend**: unit + integration tests (MSTest, real `WebApplicationFactory` HTTP
  pipeline tests included) — `python run_env.py test backend --coverage`.
- **Frontend**: component tests (Vitest + Testing Library) —
  `python run_env.py test frontend --coverage`.
- **Both**: `python run_env.py test --coverage`.

## CI/CD

Two GitHub Actions workflows under `.github/workflows/`:

- **`pr_pipeline.yml`** — runs on every pull request: backend + frontend tests, then a
  build of both images to confirm they still build cleanly.
- **`release_pipeline.yml`** — runs on push to `main`: tests, then builds and pushes the
  backend and frontend images to GitHub Container Registry (`ghcr.io`).

## Project layout

```
backend/    ASP.NET Core API — see backend/README.md
frontend/   React + Vite SPA — see frontend/README.md
deploy/     Reverse proxy, database, registry, and log-shipping config — see deploy/README.md
docker-compose.yml   Orchestrates all 8 containers
run_env.py            Day-to-day Docker Compose wrapper
```
