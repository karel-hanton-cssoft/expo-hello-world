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
- Goal: Define structure for app-level default user profile and local settings.
- Existing models: Task, Plan, and User already implemented (see `task-model.md`, `user-model.md`).

Application approach explanation:
- App stores a default User profile locally to prefill when creating new plans.
- This is NOT a global identity or authentication — just a convenience template.
- App also tracks "me" identifier for each plan (which User.id in Plan.users represents "me").
- All app state is stored in React Native AsyncStorage (key-value pairs).
- No server-side storage for app-level data — purely local to device.

Application state (requirements)
- **Default User Profile:** Template used when creating new plans
  - Stored as AsyncStorage key: `app:defaultUser`
  - Value: JSON-serialized User object (displayName, firstName, lastName, email, phoneNumber)
  - All fields optional (user might not have set up profile yet)
  
- **Plan "Me" Mapping:** Track which User.id is "me" for each plan
  - Stored as AsyncStorage key pattern: `plan:{planId}:meUserId`
  - Value: string (User.id from that plan's Plan.users array)
  - Set when: creating new plan, joining existing plan, or manually selecting "me"

- **App Settings:** Future extensibility (not implemented in v1.0)
  - Reserved AsyncStorage key: `app:settings`
  - Placeholder for theme, language, notifications, etc.

Storage helpers (requirements)
- Create TypeScript module `client/src/storage/app.ts` with functions:
  - `getDefaultUser(): Promise<User | null>` - retrieve default user profile
  - `setDefaultUser(user: User): Promise<void>` - save default user profile
  - `getMeUserId(planId: string): Promise<string | null>` - get "me" user id for plan
  - `setMeUserId(planId: string, userId: string): Promise<void>` - set "me" user id for plan
  - `clearAllAppData(): Promise<void>` - clear all app-level AsyncStorage (for testing/reset)

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
- getDefaultUser returns null if key doesn't exist or JSON is invalid.
- getMeUserId returns null if key doesn't exist.
- clearAllAppData removes all app:* and plan:*:meUserId keys.
- Functions must be unit-testable (consider mocking AsyncStorage in tests).
