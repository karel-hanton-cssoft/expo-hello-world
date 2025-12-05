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

/**
 * Generate User ID using crypto.randomUUID() or similar.
 * Returns string like "550e8400-e29b-41d4-a716-446655440000".
 */
export function generateUserId(): string {
  // React Native doesn't have crypto.randomUUID(), use fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default User;
