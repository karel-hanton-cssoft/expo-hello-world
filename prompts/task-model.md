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
  - authorId: string - required; Plan user identification
  - assigneeId: string - required; Plan user identification (same as authorId by default)
  - subtaskIds: string[] - required (may be empty); list of subtasks Ids
  - parentId: string - optional (None for Plan)
  - createdAt: string (ISO date-time) — required
  
Plan (requirements)
- Plan extends Task with following fileds:
  - users: User[] - required (at least one user Plan author); users involved in this plan (`user-model.md`)
    - User class contains id used for authorId ... 
  - accessKey: string - required (assigned by server e.g. UUID); enable access to Plan and all subTasks on API (how has key has access see `share-security.md`)
  - Note: there is NO `isPlan` boolean field. Plan is determined by root‑status (parentId missing/null).
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

