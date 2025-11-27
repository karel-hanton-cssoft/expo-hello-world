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
  planId?: ID;
  order?: number;
  createdAt: string; // ISO date-time
  updatedAt?: string; // ISO date-time
  metadata?: Record<string, unknown>;
}

export default Task;
