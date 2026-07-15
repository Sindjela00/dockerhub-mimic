# Deploy

Configuration for everything that isn't the application code itself: the reverse
proxy, database access rules, the registry's token-auth trust, and log shipping.

```
nginx.conf              Reverse proxy — routes /api, /auth, /v2, /swagger to the
                         right container; everything else goes to the frontend.
postgres/pg_hba.conf     PostgreSQL client-auth rules (password auth over TCP).
registry/config.yml      Docker Registry v2 config — enables token-based auth and
                         points it at the JWT trust material below, and configures
                         a webhook back to the backend on every push/pull.
registry/registry-public.crt   Public half of the registry's JWT signing key. Tracked in git.
registry/jwks.json              Same public key, as a JWKS document (used by some
                                 registry versions/clients instead of the cert bundle).
registry/registry-private.pem   Private half of the signing key. NOT tracked in git
                                 (see below) — the backend uses it to sign tokens,
                                 the registry uses the public half to verify them.
filebeat/filebeat.yml    Ships backend log files into Elasticsearch for the
                         Analytics section.
secrets/                 Runtime-generated secrets land here (e.g. the
                         super-administrator's initial password). Empty in git
                         except for a .gitkeep.
```

## The registry signing key pair

The registry only trusts `docker push`/`pull` tokens signed by **this specific** key
pair — `registry-public.crt` and `jwks.json` are both derived from
`registry-private.pem`, and `registry-private.pem` is deliberately not committed (it's
a private key). That means a fresh clone is missing the one file needed to make
`docker login`/`push`/`pull` work until you generate it.

`python run_env.py start` detects a missing `registry-private.pem` and generates a
fresh, self-consistent key pair (private key + matching public cert + matching
`jwks.json`) automatically — you shouldn't normally need to do this by hand. If you
ever do (e.g. to understand what's happening, or because `openssl` isn't available to
the script), here's the equivalent by hand from this directory:

```bash
# 1. Private key
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out registry/registry-private.pem

# 2. Self-signed public certificate (CN must match REGISTRY_JWT_ISSUER in .env)
openssl req -new -x509 -key registry/registry-private.pem -out registry/registry-public.crt \
    -days 3650 -subj "/CN=dockerhub-mimic-backend"

# 3. jwks.json — see run_env.py's _generate_registry_keys() for the exact modulus/exponent
#    extraction; the "kid" must match REGISTRY_JWT_KEY_ID in .env (default: registry-key-1).
```

After regenerating, restart the `backend` and `registry` containers so both pick up the
new files (`python run_env.py restart backend` and `python run_env.py restart
registry`).

**Note:** regenerating the key pair invalidates any registry tokens issued under the
old one — existing `docker login` sessions will need to re-authenticate, but no other
state is affected (it doesn't touch the database).

## Nginx routing

`nginx.conf` is intentionally simple: it's the only container with a published host
port, and every other container is reached through it.

| Path | Routed to |
|---|---|
| `/api/*` | `backend` |
| `/auth/*` | `backend` (registry token-auth endpoint) |
| `/swagger/*`, `/api/swagger/*` | `backend` |
| `/v2/*` | `registry` (the Docker Registry HTTP API — what `docker push`/`pull` actually speak) |
| everything else | `frontend` |
