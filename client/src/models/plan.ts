import { Task, TaskStatus, generateTaskId } from './task';
import { User } from './user';

/** Plan model extends the canonical Task with a few UI/share fields */
export interface Plan extends Task {
  /** Dictionary of users (User objects) keyed by user ID (e.g., "user-1", "user-2") */
  users: Record<string, User>;

  /** Access key used by the API to grant access to the Plan and subtasks */
  accessKey: string;
}

/**
 * Create a new Plan object with default values.
 * @param title - Plan title
 * @param description - Optional plan description
 * @param accessKey - Access key for sharing
 * @param meUserId - User ID of the creator (dictionary key in users)
 * @param meUser - User object for the creator
 * @returns New Plan object ready to save
 */
export function createNewPlan(
  title: string,
  description: string | undefined,
  accessKey: string,
  meUserId: string,
  meUser: User
): Plan {
  const users: Record<string, User> = {};
  users[meUserId] = meUser;

  return {
    id: generateTaskId(),
    title,
    description,
    status: TaskStatus.NEW,
    authorId: meUserId,
    assigneeId: undefined,
    subtaskIds: [],
    parentId: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
    accessKey,
    users,
  };
}

/**
 * Get next available unique user ID for a plan.
 * Finds all numeric suffixes in existing user IDs and returns "user-{max+1}".
 * @param users - Current Plan.users dictionary
 * @returns Next available user ID (e.g., "user-1", "user-4")
 */
export function getUniqueUserId(users: Record<string, User>): string {
  const userIds = Object.keys(users);
  
  // Extract numeric suffixes from user IDs like "user-1", "user-42"
  const numbers = userIds
    .map(id => {
      const match = id.match(/^user-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  
  // Find max and return max+1, or 1 if no users exist
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `user-${maxNum + 1}`;
}

export default Plan;
