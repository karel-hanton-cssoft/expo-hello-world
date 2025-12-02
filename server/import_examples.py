import json
import argparse
from pathlib import Path
from server import db

def delete_all_tasks():
    """Delete all tasks from the database."""
    with db.connect() as c:
        c.execute('DELETE FROM tasks')
        deleted = c.total_changes
    print(f'Deleted {deleted} tasks')
    return deleted

def import_all():
    base = Path(__file__).resolve().parent.parent / 'schema' / 'examples'
    imported = 0
    for f in base.glob('*.json'):
        j = json.loads(f.read_text(encoding='utf-8'))
        plan = j.get('plan')
        tasks = j.get('tasks', [])
        if plan:
            db.upsert_task(plan)
            imported += 1
        for t in tasks:
            db.upsert_task(t)
            imported += 1
    print(f'Imported {imported} tasks from examples')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import example tasks into database')
    parser.add_argument('--delete-all-before', action='store_true',
                        help='Delete all existing tasks before importing examples')
    args = parser.parse_args()
    
    db.init_db()
    
    if args.delete_all_before:
        delete_all_tasks()
    
    import_all()
