---
title: "Task model prompt"
intent: "Design a compact, extendable JSON and TypeScript model for Tasks (client-first)."
persona: "Backend/Frontend API developer — prefers small, testable changes with clear TypeScript types."
version: "1.2"
tags: ["model","api"]
---

Context
- App: client-only, Expo SDK 54 + TypeScript strict mode.
- Domain: **Task** is main data entity; Tasks are in tree heirarchy; Root Task is **Plan**;
- Goal: minimal Task and Plan data model for client-only work; compact, simple fields.

Task (requirements)
- Each Task has following fields - types, required/optional, description (use these exact names)
  - id: string (unique e.g. UUID - required; cross system unique identifier
  - title: string - required, non-empty; base task text ("buy tickets", "insurance", "choose connections")
  - description: string - optional; detailed task description ("Travel insurance for whole family on next week.")
  - result: string - optional; result task text (selected connections)
  - status: enum (new, automatic, in_progress, done) - required;
    - new: newly created task without any action yet
    - automatic: presented state is based on subtasks (used for parent Tasks)
    - in_progress: assignee can set to inform about progress
    - done: assignee set when task is finished
  - authorId: string - required; User ID (key from Plan.users dictionary)
  - assigneeId: string - optional; User ID (key from Plan.users dictionary); same as authorId by default
  - subtaskIds: string[] - required (may be empty); list of subtasks Ids
  - parentId: string - optional (None for Plan)
  - createdAt: string (ISO date-time) — required
  - updatedAt: string (ISO date-time) - optional; last modification timestamp

Task methods (instance methods on Task objects):
- `getTasksUsingUserId(userId: string): Task[]`
  - Returns array of all tasks (including this task) where userId is used as authorId or assigneeId
  - Recursively searches through this task and all its subtasks
  - Useful before deleting user from Plan.users to check if user is referenced
  - Example: `plan.getTasksUsingUserId("user-1")` returns all tasks created by or assigned to user-1
  - Note: Requires access to all tasks in the plan to resolve subtaskIds
  
Plan (requirements)
- Plan extends Task with following fields:
  - users: Record<string, User> (TypeScript) or Dict[str, User] (Python) - required (at least one user - Plan author)
    - Dictionary where key is user ID (e.g., "user-1", "user-2") and value is User object
    - User IDs are immutable once assigned - cannot be changed, only deleted
    - User object does NOT contain id field - ID is the dictionary key (see `user-model.md`)
  - accessKey: string - required (assigned by server e.g. UUID); enable access to Plan and all subTasks on API (how has key has access see `share-security.md`)
  - Note: there is NO `isPlan` boolean field. Plan is determined by root‑status (parentId missing/null).

Plan methods (instance methods on Plan objects):
- `getUniqueUserId(): string`
  - Returns next available unique user ID for this plan
  - Algorithm: finds all numeric suffixes in existing user IDs (e.g., "user-1" → 1, "user-42" → 42)
  - Returns "user-{max+1}" where max is highest found number (or 0 if no users exist)
  - Example: if Plan.users has keys ["user-1", "user-3"], returns "user-4"
  - User IDs are immutable - once assigned, cannot be changed

- Note: each Plan is represented by single UI screen (`client-ui.md`)

Design rules & constraints
- Prefer consistent English field names across code.
- Plan extends Task in object design meaning

Required outputs (format & versions)
- TypeScript: exact `Task` and `Plan` (extending Task) interfaces with JSDoc, strict mode-compatible.
- JSON Schema: for `Task` and `Plan` explicitly state version 2020-12
- OpenAPI: minimal OpenAPI 3.0.3 fragment (components.schemas + paths) covering CRUD endpoints: POST /tasks, GET /tasks, GET /tasks/{id}, PATCH /tasks/{id}, DELETE /tasks/{id}.
  - Plan use exatly same API. Server side works with both same way. 
- Examples: provide two Plan JSON examples with hierarchy demonstrating nested tasks by ID.

Acceptance criteria (testable)
- TypeScript interfaces must compile under TypeScript strict mode (explain minimal compile checks to run).
- JSON Schema (2020-12) must validate both example plan payloads without errors (mention AJV as validator in docs).
- OpenAPI snippet must refer to the same schema types and be consistent (field names + types match).
- Provide 1–2 short unit test descriptions showing how to validate one example via AJV (not implementation yet).

