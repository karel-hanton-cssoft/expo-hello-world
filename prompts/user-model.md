---
title: "User model prompt"
intent: "Design a minimal User model for plan participants."
persona: "Backend/Frontend API developer — prefers simple, testable changes with clear TypeScript types."
version: "1.0"
tags: ["model","api"]
---

Context
- App: Expo SDK 54 + TypeScript strict mode, FastAPI + SQLite backend.
- Domain: **User** represents a person who can create plans, be assigned tasks, and collaborate with others.
- Goal: minimal User data model for plan users.
- Existing models: Task and Plan already implemented (see `task-model.md`).

Users approach explanation:
- User is only used to distinguish Task author and assignee (who created vs who is responsible).
- Only required field is `displayName` — minimal identifier for UI display.
- Other fields (email, phone) are optional metadata to help contact/share outside the app.
- No access control based on users — access is controlled solely via Plan.accessKey (see `share-security.md`).
- Users exist only within Plan context (Plan.users dictionary) — no global user registry or cross-plan identity.
- **User ID is NOT part of User structure** — User ID is the key in Plan.users dictionary.

User (requirements)
- Each User has following fields - types, required/optional, description (use these exact names):
  - displayName: string - required; user's display name shown in UI
  - firstName: string - optional; just to have full name
  - lastName: string - optional; just to have full name
  - email: string - optional; only support information to share accessKey sharing
  - phoneNumber: string - optional; only support information to share accessKey sharing
- **Note:** User does NOT have `id` field. User ID is managed by Plan as dictionary key.

Users Store
  - **Plan Users:** Each Plan has isolated dictionary of users (Plan.users: Record<string, User> or Dict[str, User]). Keys are user IDs (e.g., "user-1", "user-2"), values are User objects.
  - **User ID generation:** Plan provides `getUniqueUserId()` method that returns next available user ID (e.g., finds max numeric suffix and returns "user-{max+1}").
  - **User ID immutability:** Once created, user ID cannot be changed. User can only be deleted from Plan.users dictionary.
  - **"Me" identifier:** App locally tracks which User ID represents "me" for each plan (stored in AsyncStorage key `plan:{planId}:meUserId`).
  - When creating new plan: app calls `plan.getUniqueUserId()` to get ID for "me" User, prefills User data from app-level default profile.
  - When joining existing plan via accessKey: user manually identifies themselves; or creates new User entry using `getUniqueUserId()`; or "Me" representation is part of joining link.
- **App-level default User:** Optional convenience — app can store one default User profile (displayName, email, phone) to prefill when creating new plans. This is NOT a global identity, just a template. Default user still needs ID assigned via `getUniqueUserId()` when added to plan.

Design rules & constraints
- Prefer consistent English field names across code.
- Keep User model minimal - avoid storing sensitive data (passwords, tokens) in this model.
- User profile is mutable (displayName and others can be updated within Plan.users dictionary).
- User ID is immutable - cannot be changed once assigned as dictionary key. User can only be deleted.
- Email should be validated format not necessary unique.
  - Email does NOT need to be globally unique (same person can have different User ID in different plans).
  - Within single Plan, email uniqueness is not enforced (users might share contact info or have typos).

Required outputs (format & versions)
- TypeScript: exact `User` interface with JSDoc, strict mode-compatible (NO `id` field).
- JSON Schema: for `User` explicitly state version 2020-12 (NO `id` field).
- Examples: extend `User` structures to examples (users shown as dictionary entries).
- Server: update `User` on Python server if needed (NO `id` field).
- OpenAPI: Update Plan schema in `docs/openapi/task.yaml` to reflect full User structure as dictionary (no new endpoints).
  - no OpenAPI for `User`, users are part of Plan - covered by Task OpenAPI endpoint
- ~~helper function `generateUserId(): string`~~ - NOT NEEDED, Plan.getUniqueUserId() handles this

Acceptance criteria (testable)
- TypeScript interface must compile under TypeScript strict mode.
- JSON Schema (2020-12) must validate all example user payloads without errors (AJV validator).
- OpenAPI snippet must refer to the same schema types and be consistent (field names + types match).
- Email field must use email format validation in JSON Schema.
- User examples should include varied displayNames and one with/without email/phone.