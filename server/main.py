from fastapi import FastAPI, HTTPException, Path, Query
from typing import Optional
from . import db
from . import schemas
from datetime import datetime

app = FastAPI(title='Task API (file-SQLite)')


@app.on_event('startup')
def on_startup():
    db.init_db()


@app.get('/tasks')
def list_tasks(parentId: Optional[str] = Query(None), planId: Optional[str] = Query(None), recursive: bool = Query(False), limit: int = Query(100), offset: int = Query(0)):
    # Support for returning a plan subtree: GET /tasks?planId={planId}&recursive=true
    if planId and recursive:
        items = db.get_subtree(planId)
        return {'items': items, 'total': len(items)}

    return db.list_tasks(limit=limit, offset=offset, parentId=parentId)


@app.post('/tasks', status_code=201)
def create_task(payload: schemas.TaskCreate):
    now = datetime.utcnow().isoformat() + 'Z'
    # build minimal Task object (id MUST be provided by client)
    task = payload.model_dump()
    # Client generates task.id (UUID v4) - single source of truth
    # Server stores it unchanged - NO server-side ID generation
    task.setdefault('subtaskIds', [])
    task['createdAt'] = now
    task['updatedAt'] = None
    db.upsert_task(task)
    return task


@app.get('/tasks/{id}')
def get_task(id: str = Path(...)):
    t = db.get_task(id)
    if t is None:
        raise HTTPException(status_code=404, detail='Not found')
    return t


@app.put('/tasks/{id}')
def update_task(id: str, payload: schemas.TaskUpdate):
    existing = db.get_task(id)
    if existing is None:
        raise HTTPException(status_code=404, detail='Not found')
    data = existing
    update = payload.model_dump(exclude_unset=True)
    data.update(update)
    data['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
    db.upsert_task(data)
    return data


@app.patch('/tasks/{id}')
def patch_task(id: str, payload: schemas.TaskUpdate):
    """Partial update of task (e.g., updating subtaskIds array)"""
    existing = db.get_task(id)
    if existing is None:
        raise HTTPException(status_code=404, detail='Not found')
    data = existing
    update = payload.model_dump(exclude_unset=True)
    data.update(update)
    data['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
    db.upsert_task(data)
    return data


@app.delete('/tasks/{id}', status_code=204)
def delete_task_endpoint(id: str):
    ok = db.delete_task(id)
    if not ok:
        raise HTTPException(status_code=404, detail='Not found')
    return None
