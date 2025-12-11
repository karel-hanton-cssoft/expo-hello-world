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

/**
 * Post a new task/plan to the server.
 * @param task - Task or Plan object to create on server
 * @returns Created task from server
 */
export async function postTask(task: Task): Promise<Task> {
  const url = `${SERVER}/tasks`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`POST task failed: ${res.status} - ${errorText}`);
  }
  
  return await res.json() as Task;
}

/**
 * Update a task/plan on the server (partial update).
 * @param taskId - ID of task to update
 * @param updates - Partial task object with fields to update
 * @returns Updated task from server
 */
export async function patchTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const url = `${SERVER}/tasks/${taskId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`PATCH task failed: ${res.status} - ${errorText}`);
  }
  
  return await res.json() as Task;
}

/**
 * Delete a task/plan from the server.
 * @param taskId - ID of task to delete
 */
export async function deleteTask(taskId: string): Promise<void> {
  const url = `${SERVER}/tasks/${taskId}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`DELETE task failed: ${res.status} - ${errorText}`);
  }
}

export default { fetchAllTasks, groupIntoPlans, postTask, patchTask, deleteTask };
