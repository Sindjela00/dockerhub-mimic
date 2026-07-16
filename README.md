# dockerhub-mimic

## First-time setup

On first startup (when no super-administrator account exists yet), the backend generates one and writes its initial password to `./deploy/secrets/super-admin-password.txt` on the host machine. Log in with username `superadmin` and that password — you will be required to change it before you can use the rest of the system. The password file is only regenerated if the super-administrator account does not yet exist in the database.

Container orchestration includes the required containers:
- `app` (web application)
- `db` (PostgreSQL)
- `reverse-proxy` (Nginx between user and app)
- `mem-cache` (Redis in-memory cache)

## Environment Management (run_env.py)

The `run_env.py` script manages Docker Compose services.

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start all services | `python run_env.py start --build` |
| `stop` | Stop services | `python run_env.py stop` |
| `down` | Stop and remove containers | `python run_env.py down --volumes` |
| `restart` | Restart service(s) | `python run_env.py restart app` |
| `logs` | View logs | `python run_env.py logs reverse-proxy -f` |
| `status` | Show service status | `python run_env.py status` |
| `build` | Build images | `python run_env.py build app` |
| `clean` | Full cleanup (containers, images, volumes) | `python run_env.py clean` |
| `exec` | Execute command in container | `python run_env.py exec app sh` |
