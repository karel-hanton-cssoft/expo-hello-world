import type { Task } from './models';

const SERVER = 'http://targettrace.cz:8123';

export async function fetchAllTasks(limit = 1000): Promise<Task[]> {
  const url = `${SERVER}/tasks?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch tasks failed: ${res.status}`);
  const json = await res.json();
  // server returns { items: [ ... ], total }
  return json.items as Task[];
}

// Group flat tasks into plan objects: find roots (no parentId) as plans
export function groupIntoPlans(tasks: Task[]) {
  const byId = new Map<string, Task>();
  tasks.forEach((t) => byId.set(t.id, t));

  const roots = tasks.filter((t) => !t.parentId);

  function collectDescendants(root: Task) {
    const out: Task[] = [];
    const q = [...(root.subtaskIds || [])];
    while (q.length) {
      const id = q.shift()!;
      const t = byId.get(id);
      if (t) {
        out.push(t);
        if (t.subtaskIds && t.subtaskIds.length) q.push(...t.subtaskIds);
      }
    }
    return out;
  }

  return roots.map((r) => ({ plan: r, tasks: [r, ...collectDescendants(r)] }));
}

export default { fetchAllTasks, groupIntoPlans };
