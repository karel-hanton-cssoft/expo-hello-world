import sqlite3
import json
from pathlib import Path
from typing import Optional, Dict, Any

DB_PATH = Path(__file__).resolve().parent / 'data' / 'tasks.sqlite'
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def connect():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect() as c:
        c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT
        );
        ''')
        c.execute('CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks(createdAt);')

def upsert_task(task: Dict[str, Any]):
    now = task.get('updatedAt') or task.get('createdAt')
    if not now:
        from datetime import datetime
        now = datetime.utcnow().isoformat() + 'Z'
    data = json.dumps(task, ensure_ascii=False)
    with connect() as c:
        c.execute(
            """
            INSERT INTO tasks(id, data, createdAt, updatedAt)
            VALUES(?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data=excluded.data, updatedAt=excluded.updatedAt;
            """,
            (task['id'], data, task.get('createdAt', now), now),
        )

def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    with connect() as c:
        r = c.execute('SELECT data FROM tasks WHERE id = ?', (task_id,)).fetchone()
        return json.loads(r['data']) if r else None

def delete_task(task_id: str) -> bool:
    with connect() as c:
        cur = c.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        return cur.rowcount > 0

def list_tasks(limit: int = 100, offset: int = 0, parentId: Optional[str] = None):
    with connect() as c:
        if parentId:
            cur = c.execute('SELECT data FROM tasks WHERE json_extract(data, "$.parentId") = ? LIMIT ? OFFSET ?', (parentId, limit, offset))
        else:
            cur = c.execute('SELECT data FROM tasks LIMIT ? OFFSET ?', (limit, offset))
        rows = cur.fetchall()
        items = [json.loads(r['data']) for r in rows]
        total = c.execute('SELECT COUNT(1) FROM tasks').fetchone()[0]
        return {'items': items, 'total': total}
