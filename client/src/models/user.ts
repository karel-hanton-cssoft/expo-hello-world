/**
 * Lightweight User model used by the client.
 * As requested, the canonical payload contains only a single id field for now.
 */

export type ID = string;

/** Minimal User representation (for UI reference) */
export interface User {
  /** Unique id for the user (string) */
  id: ID;
}

export default User;
