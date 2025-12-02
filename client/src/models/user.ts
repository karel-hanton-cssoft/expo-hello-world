/**
 * User model for plan participants.
 * Minimal identifier with optional contact metadata.
 * No authentication or access control - users are labels only.
 */

export type ID = string;

/**
 * User represents a person in a plan.
 * Users exist only within Plan context (Plan.users array) - no global registry.
 */
export interface User {
  /** Unique identifier (e.g. UUID) - cross-system unique */
  id: ID;

  /** Display name shown in UI */
  displayName: string;

  /** Optional first name for full name display */
  firstName?: string;

  /** Optional last name for full name display */
  lastName?: string;

  /** Optional email for contact/sharing (not globally unique) */
  email?: string;

  /** Optional phone number for contact/sharing */
  phoneNumber?: string;
}

export default User;
