# Backend

ASP.NET Core (.NET 10) API — authentication, repositories, organizations, the Docker
Registry token-auth bridge, and the Elasticsearch-backed log analytics endpoint.

## Tech stack

- **ASP.NET Core 10** Web API, **Entity Framework Core** + Npgsql (PostgreSQL)
- **JWT bearer auth** for the app itself, plus a separate **RS256 JWT** flow for
  authorizing `docker` CLI push/pull against the bundled registry
- **StackExchange.Redis** (`mem-cache`) — caches the docker-login → registry-token
  bridge credential
- **Serilog** → JSON log files → **Filebeat** → **Elasticsearch**, queried through a
  hand-rolled `AND`/`OR`/`NOT`/parentheses query parser (`Services/LogQuery/`)
- **MSTest** for unit and integration tests (the latter boot the real app via
  `WebApplicationFactory<Program>`)

## Project layout

```
Controllers/     HTTP endpoints — thin, delegate to Services
Services/        Business logic (one interface + implementation per area)
Services/LogQuery/  Tokenizer/parser/compiler for the Analytics log query language
Models/          EF Core entities
Data/            AppDbContext, DatabaseSeeder (schema patches + first-run seed data)
Authorization/   Custom "must change password" authorization policy
Tests/           Unit + integration tests (MSTest)
```

## Authentication & roles

Three roles: `User`, `Administrator`, `SuperAdmin` (`Models/User.cs`). On first startup,
`DatabaseSeeder` creates a single super-administrator account with a random password
written to `Seed:SuperAdminPasswordFilePath` (`/app/secrets/super-admin-password.txt` in
the container, mapped to `./deploy/secrets/super-admin-password.txt` on the host — see
the root README's Quickstart). The account is flagged `MustChangePassword = true`; a
custom authorization policy (`Authorization/MustChangePasswordHandler.cs`) blocks every
endpoint except the change-password one until that's cleared.

## Docker Registry integration

The bundled `registry` container (`registry:2`) is configured for token-based auth
(`deploy/registry/config.yml`) trusting RS256 JWTs signed by this backend. The flow:

1. `docker login` → `POST /api/auth/login` (normal app login) also caches the
   plaintext password in Redis, keyed by username, for a short window.
2. `docker push`/`pull` → the registry challenges the client, which requests a token
   from `GET /auth/token` (`RegistryController`). That endpoint authenticates either via
   Basic auth (the cached credential from step 1) or an existing bearer token, then
   `RegistryService` resolves what `pull`/`push` scopes the caller actually has for the
   requested repository (owner, org role, or per-team repository permission) before
   signing a scoped RS256 JWT with the key pair under `deploy/registry/` (see
   [`../deploy/README.md`](../deploy/README.md) for how that key pair is generated).
3. The registry posts push/pull events back to `POST /registry/events`, which is how tag
   metadata (digest, size, pull count, etc.) gets recorded — **this is also why a
   repository must already exist in the app before you can push to it**: the token
   endpoint only grants `push` scope for repositories the caller already has rights to.

## Configuration

Config comes from `appsettings.json` / `appsettings.Development.json` plus environment
variables (set via the root `.env` when running through Docker Compose — see
`.env.example`). Notable keys: `ConnectionStrings:DefaultConnection`, `Jwt:*`,
`Redis:Configuration`, `Elasticsearch:Uri`, `Registry:*`, `App:BaseUrl`, `Email:*`.
`Seed:*` keys control the seeded admin/demo accounts and can be overridden for tests.

## Running

The reliable way to run the backend — and the only way that also gets you Postgres,
Redis, Elasticsearch, and the registry for free — is through the full stack:

```
python ../run_env.py start --build
python ../run_env.py logs backend -f
```

**Local `dotnet run`, without Docker:** the `db` and `mem-cache` containers don't
publish host ports by default, so a bare `dotnet run` can't reach them. If you want
hot-reload against the containerized database, start just the dependencies and
temporarily expose Postgres's port:

```
docker compose up -d db mem-cache elasticsearch registry
```

then add `ports: ["5432:5432"]` under the `db` service locally (don't commit that), set
`ConnectionStrings__DefaultConnection` to point at `localhost:5432`, and run:

```
dotnet run
```

Swagger UI is available at `/swagger` when `ASPNETCORE_ENVIRONMENT=Development` (the
default in `docker-compose.yml`).

## Tests

```
python ../run_env.py test backend            # run once
python ../run_env.py test backend --coverage # with an HTML coverage report
```

This runs the exact same Docker-based test stage that CI uses
(`docker build --target test`), so a green run locally means a green run in CI. You can
also run `dotnet test` directly from this directory if you have the .NET 10 SDK
installed — it's faster for iterating on a single test file.
