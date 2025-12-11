#!/usr/bin/env python3
"""
Development utility to dump all tasks from the database.
Usage: python -m server.dump_tasks
"""
import json
from . import db

def dump_tasks():
    """Dump all tasks from database to console in JSON format."""
    print("=== Dumping all tasks from database ===\n")
    
    # Initialize DB
    db.init_db()
    
    # Fetch all tasks (high limit to get everything)
    result = db.list_tasks(limit=10000, offset=0)
    tasks = result['items']
    total = result['total']
    
    print(f"Total tasks in database: {total}\n")
    
    if not tasks:
        print("No tasks found in database.")
        return
    
    # Print each task with nice formatting
    for i, task in enumerate(tasks, 1):
        print(f"--- Task {i}/{total} ---")
        print(json.dumps(task, indent=2, ensure_ascii=False))
        print()
    
    print("=== End of dump ===")

if __name__ == '__main__':
    dump_tasks()
