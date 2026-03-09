# dockerhub-mimic

## Environment Management (run_env.py)

The `run_env.py` script manages Docker Compose services.

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start all services | `python run_env.py start --build` |
| `stop` | Stop services | `python run_env.py stop` |
| `down` | Stop and remove containers | `python run_env.py down --volumes` |
| `restart` | Restart service(s) | `python run_env.py restart backend` |
| `logs` | View logs | `python run_env.py logs frontend -f` |
| `status` | Show service status | `python run_env.py status` |
| `build` | Build images | `python run_env.py build backend` |
| `clean` | Full cleanup (containers, images, volumes) | `python run_env.py clean` |
| `exec` | Execute command in container | `python run_env.py exec backend sh` |
