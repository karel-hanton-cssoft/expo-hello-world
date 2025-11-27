# Task API server (FastAPI + SQLite)

This is a minimal RESTful server implementing `docs/openapi/task.yaml` using FastAPI and a file-based SQLite database.

Requirements:
- Python 3.12.3
- Install deps: `pip install -r requirements.txt`

Run locally:

```bash
cd server
python -m uvicorn main:app --reload --port 8000
```

The server stores tasks in `server/data/tasks.sqlite`.
