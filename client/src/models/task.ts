/**
 * Task model (client-side TypeScript)
 * Matches the task-model prompt: compact, explicit, and strict-mode friendly.
 */

export type ID = string;

/** Task status enum */
export enum TaskStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  AUTOMATIC = 'automatic',
  DONE = 'done',
}

/** Core Task interface */
export interface Task {
  id: ID;
  title: string;
  description?: string;
  result?: string;
  status: TaskStatus;
  authorId: ID;
  assigneeId?: ID;
  subtaskIds: ID[];
  parentId?: ID | null;
  createdAt: string; // ISO date-time
  updatedAt?: string; // ISO date-time
}

/**
 * Get all tasks that reference a specific user ID.
 * Recursively searches through this task and all its subtasks.
 * @param task - The task to start from (typically the plan itself)
 * @param userId - User ID to search for (key from Plan.users dictionary)
 * @param allTasksMap - Map of all tasks by ID (for resolving subtaskIds)
 * @returns Array of tasks where userId is used as authorId or assigneeId
 */
export function getTasksUsingUserId(task: Task, userId: ID, allTasksMap: Map<ID, Task>): Task[] {
  const result: Task[] = [];
  
  // Check this task
  if (task.authorId === userId || task.assigneeId === userId) {
    result.push(task);
  }
  
  // Recursively check all subtasks
  for (const subtaskId of task.subtaskIds) {
    const subtask = allTasksMap.get(subtaskId);
    if (subtask) {
      result.push(...getTasksUsingUserId(subtask, userId, allTasksMap));
    }
  }
  
  return result;
}

/**
 * Generate Task/Plan ID using UUID v4 pattern.
 * Returns string like "550e8400-e29b-41d4-a716-446655440000".
 */
export function generateTaskId(): string {
  // React Native doesn't have crypto.randomUUID(), use fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default Task;
