---
title: "Application model prompt"
intent: "Design app-level state and storage for user profile and local settings."
persona: "Mobile app developer — focuses on React Native, AsyncStorage, and offline-first user experience."
version: "1.0"
tags: ["model", "storage", "app"]
---

Context
- App: Expo SDK 54 + TypeScript strict mode, React Native with AsyncStorage.
- Domain: **Application** represents app-level state that persists across sessions.
- Goal: Define structure for app-level: default user profile; Plans list; and local settings.
- Existing models: Task, Plan, and User already implemented (see `task-model.md`, `user-model.md`).

Application local data approach:
- App stores one **Default User profile** locally to prefill first user when creating new plan.
  - This is NOT a global identity or authentication — just a convenience template.
- App stores a **App Plans List** with following main information:
  - **Plan ID** identify Plan root task
  - **Plan Access Key** accessKey for all plan tasks on server
  - **Plan User Me** one of plan users which representing Me
- All app state data are stored in React Native AsyncStorage (key-value pairs).
- No server-side storage for app-level data — purely local to device.

Application data requirements:
- **Default User Profile:** Template used when creating new plan
  - in TypeScript: User interface
  - required:
    - automatically filled on first app startup (by default id="defaultUser", displayName="Me")
    - then user is prompted to update it on first app startup
  - Stored as AsyncStorage key: `app:defaultUser`
  - Value: JSON-serialized User object (displayName, firstName, lastName, email, phoneNumber)
  
- **App Plans list** Plans list this App is working with
  - in TypeScript: string[] (array of plan IDs)
  - required: list can be empty, but is required
  - Stored as AsyncStorage key: `app:plans`
  - Value: JSON-serialized array of plan IDs (e.g. ["plan:id1", "plan:id2"])
  - Plan ID is the primary key - no need to store it as a value (would be redundant)
  - addPlan() overwrites existing plan data (simpler than checking existence)

- **Plan Access Key** enables application to obtain all Plan Tasks from server
  - required: for each plan in list
  - immutable: never change after plan record is created
  - Stored as AsyncStorage key - part of Plan pattern: `plan:{taskId}:accessKey`
  - Value: string - long random not guessed string (e.g. UUID + datetime)

- **Plan User Me** define which one of Plan users represent "Me"
  - required: for each plan in list
  - consistent: must be id of one of the Plan users
  - Stored as AsyncStorage key - part of Plan pattern: `plan:{taskId}:meUserId`
  - Value: string (User.id)

- **App Settings:** Future extensibility (not implemented in v1.0)
  - Reserved AsyncStorage key: `app:settings`
  - Placeholder for theme, language, notifications, etc.

Storage helpers (requirements)
- Create TypeScript module `client/src/storage/app.ts` with functions:
  - Note: For User.id generation, use `generateUserId()` from `client/src/models/user.ts`
  - `getDefaultUser(): Promise<User>` - retrieve default user profile; creates default (id="defaultUser", displayName="Me") if not exists
  - `setDefaultUser(user: User): Promise<void>` - save default user profile
  - `addPlan(planId: string, accessKey: string, meUserId: string): Promise<void>` - add planId to app:plans and set accessKey/meUserId; overwrites if planId already exists
  - `getPlans(): Promise<string[]>` - get all plan IDs
  - `getPlan(planId: string): Promise<{accessKey: string, meUserId: string} | null>` - get whole plan data
    - Note: use `getPlan()` when you need both accessKey and meUserId to minimize AsyncStorage reads
  - `getAccessKey(planId: string): Promise<string | null>` - get accessKey for plan
  - `getMeUserId(planId: string): Promise<string | null>` - get "me" user id for plan
  - `setMeUserId(planId: string, userId: string): Promise<void>` - set "me" user id for plan
  - `removePlan(planId: string): Promise<void>` - deletes app plan record completely (id, accessKey and meUserId)
  - `clearAllAppData(): Promise<void>` - clear all app-level AsyncStorage (app:defaultUser, app:plans, all plan:{id}:accessKey and plan:{id}:meUserId)
    - serves only for testing/development purposes, never used in real operation
  - `generateAccessKey(): string` - generates Access Key using crypto.randomUUID() or similar (returns string like "550e8400-e29b-41d4-a716-446655440000")
  
Design rules & constraints
- Use AsyncStorage from `@react-native-async-storage/async-storage`.
- All functions are async (AsyncStorage API is promise-based).
- Handle JSON parse errors gracefully (return null on invalid data).
- Keys use namespaced format: `app:*` for app-level, `plan:{id}:*` for plan-specific.
- No schema validation in storage layer (validation happens at UI/API boundaries).

Required outputs (format & versions)
- TypeScript: `client/src/storage/app.ts` module with JSDoc, strict mode-compatible.
- No JSON Schema needed (app state is not shared or validated against schema).
- No server changes (app state is purely local).
- Update package.json if `@react-native-async-storage/async-storage` is not already installed.

Acceptance criteria (testable)
- TypeScript module must compile under strict mode.
- All functions must handle AsyncStorage errors gracefully (try-catch).
- getXXX(planId) returns null if key doesn't exist.
- Functions must be unit-testable (consider mocking AsyncStorage in tests).
