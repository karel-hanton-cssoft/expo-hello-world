import { Task } from './task';

/** Plan model extends the canonical Task with a few UI/share fields */
export interface Plan extends Task {
  /** Optional lightweight list of users (ids or names) used by UI */
  users?: string[];

  /** Access key used by the API to grant access to the Plan and subtasks */
  accessKey: string;
}

export default Plan;
