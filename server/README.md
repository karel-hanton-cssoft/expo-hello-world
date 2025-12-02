
# Task API server (FastAPI + SQLite)

Minimal RESTful server implementing `docs/openapi/task.yaml` using FastAPI and a file-based SQLite database.

Prerequisites
- Python 3.12.3

Setup (from repo root)

```bash
# change to repo root (where `server/` lives)
cd /path/to/expo-hello-world

# create and activate virtualenv (Unix/macOS)
python3 -m venv server/.venv
source server/.venv/bin/activate

# install dependencies
pip install -r server/requirements.txt
```

Initialize database and import examples

```bash
# from repo root
cd /path/to/expo-hello-world
# initialize SQLite file and schema
.venv/bin/python -c "from server import db; db.init_db()"

# import example plans/tasks into the DB
.venv/bin/python server/import_examples.py
# Import without deleting
.venv/bin/python -m server.import_examples

# Delete all tasks and import fresh examples
.venv/bin/python -m server.import_examples --delete-all-before
```

Deploy to remote server

```bash
# from repo root - copy server and schema directories to remote host
scp -r server/ schema/ targettrace@targettrace.cz:~/work/just-plan-it/
```

Run the server

```bash
# from repo root (recommended)
cd /path/to/expo-hello-world
server/.venv/bin/python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8123
```

Notes
- The server stores the SQLite file at `server/data/tasks.sqlite`.
- If you prefer to run commands while inside `server/`, ensure the parent directory is on `PYTHONPATH` or use the `-m` form shown above.
- FastAPI provides interactive docs at `http://127.0.0.1:8000/docs` and `http://127.0.0.1:8000/redoc` while the server is running.
