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
- Only required fields are `id` and `displayName` — minimal identifier for UI display.
- Other fields (email, phone) are optional metadata to help contact/share outside the app.
- No access control based on users — access is controlled solely via Plan.accessKey (see `share-security.md`).
- Users exist only within Plan context (Plan.users array) — no global user registry or cross-plan identity.

User (requirements)
- Each User has following fields - types, required/optional, description (use these exact names):
  - id: string (unique e.g. UUID) - required; cross-system unique identifier
  - displayName: string - required; user's display name shown in UI
  - firstName: string - optional; just to have full name
  - lastName: string - optional; just to have full name
  - email: string - optional; only support information to share accessKey sharing
  - phoneNumber: string - optional; only support information to share accessKey sharing

Users Store
  - **Plan Users:** Each Plan has isolated list of users (Plan.users array). No shared user registry across plans.
  - **"Me" identifier:** App locally tracks which User.id represents "me" for each plan (stored in app state, e.g., AsyncStorage key `plan:{planId}:meUserId`).
  - When creating new plan: app prefills "me" User from app-level default profile.
  - When joining existing plan via accessKey: user manually identifies themselves; or creates new User entry; or "Me" representation is part of joining link.
- **App-level default User:** Optional convenience — app can store one default User profile (displayName, email, phone) to prefill when creating new plans. This is NOT a global identity, just a template.

Design rules & constraints
- Prefer consistent English field names across code.
- Keep User model minimal - avoid storing sensitive data (passwords, tokens) in this model.
- User profile is mutable (displayName and others can be updated).
- Email should be validated format not necessary unique.
  - Email does NOT need to be globally unique (same person can have different User.id in different plans).
  - Within single Plan, email uniqueness is not enforced (users might share contact info or have typos).

Required outputs (format & versions)
- TypeScript: exact `User` interface with JSDoc, strict mode-compatible.
- JSON Schema: for `User` explicitly state version 2020-12.
- Examples: extend `User` structures to examples
- Server: update `User` on Python server if needed
- OpenAPI: Update Plan schema in `docs/openapi/task.yaml` to reflect full User structure (no new endpoints).
  - no OpenAPI for `User`, users are part of Plan - covered by Task OpenAPI endpoint
- helper function `generateUserId(): string` - generates User ID string based on data requirements

Acceptance criteria (testable)
- TypeScript interface must compile under TypeScript strict mode.
- JSON Schema (2020-12) must validate all example user payloads without errors (AJV validator).
- OpenAPI snippet must refer to the same schema types and be consistent (field names + types match).
- Email field must use email format validation in JSON Schema.
- User examples should include varied displayNames and one with/without email/phone.