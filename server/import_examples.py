import json
from pathlib import Path
from server import db

def import_all():
    base = Path(__file__).resolve().parent.parent / 'schema' / 'examples'
    for f in base.glob('*.json'):
        j = json.loads(f.read_text(encoding='utf-8'))
        plan = j.get('plan')
        tasks = j.get('tasks', [])
        if plan:
            db.upsert_task(plan)
        for t in tasks:
            db.upsert_task(t)

if __name__ == '__main__':
    db.init_db()
    import_all()
    print('Imported examples')
