---
title: "Application Use Cases"
intent: "Define user workflows and acceptance criteria for the task planning app"
persona: "Product owner / UX designer - focuses on user experience and feature completeness"
version: "1.0"
tags: ["use-case", "workflow", "requirements"]
---

## Overview
This document defines high-level user workflows for the Just Plan It application. Each use case describes:
- **Actor:** Who performs the action
- **Precondition:** Required state before the action
- **Flow:** Step-by-step user actions and system responses
- **Success Criteria:** Observable outcomes that confirm success
- **Error Cases:** What happens when things go wrong

## Use Case Template

```markdown
## UC-XX: [Use Case Title]

**Actor:** [User role, e.g., Plan Creator, Plan Participant]

**Precondition:** 
- [Required state, e.g., App installed, User has accessKey]

**Main Flow:**
1. User [action]
2. App [response]
3. System [background operation]
4. User sees [result]

**Success Criteria:**
- [ ] [Observable outcome 1]
- [ ] [Observable outcome 2]
- [ ] [Data persisted correctly]

**Error Cases:**
- **No internet connection:** [Behavior]
- **Invalid data:** [Behavior]
- **Server error:** [Behavior]

**Technical Notes:**
- Storage: [AsyncStorage keys affected]
- API: [Server endpoints called]
- State: [App state changes]
```

---

## Example Use Case

## UC-01: First App Launch & Setup ✅

**Status:** IMPLEMENTED

**Actor:** New User

**Precondition:** 
- App freshly installed
- No previous data in AsyncStorage, OR
- Default user is still default profile (displayName="Me" with no other fields)

**Main Flow:**
1. User opens app for the first time
2. App calls `getDefaultUser()` which creates default user if none exists (displayName="Me")
3. App checks if user profile is still default (only displayName="Me", no other fields)
4. If default profile detected → App shows UserDialog in "first launch" mode:
   - Welcome message: "👋 Welcome to Task Planner! Let's set up your profile"
   - Explanation: "You can use the default 'Me' or customize it with your details"
   - Form pre-filled with displayName="Me"
   - **NO Back/Cancel button** (user must continue)
   - Button text: "Continue" (instead of "Save")
5. User can:
   - Keep default "Me" and tap Continue, OR
   - Edit displayName to "John" and optionally add firstName, lastName, email, phoneNumber, OR
   - Tap "Import from Contacts" to auto-fill from phone contacts
6. User taps "Continue"
7. App validates (displayName is required)
8. App saves updated profile via `saveDefaultUser()`
9. App initializes empty app settings: `setAppSettings({})`
10. Dialog closes, app shows main operational state (Plans Display)
    - First time shows empty plans list with "Create Plan" button

**Success Criteria:**
- [x] Default user created automatically on first app start
- [x] UserDialog shown in onboarding mode when default profile detected
- [x] User cannot cancel/skip during first launch (no Back button)
- [x] User can edit profile fields or import from contacts
- [x] Profile persists in AsyncStorage (app:defaultUser)
- [x] App settings initialized in AsyncStorage (app:settings) as empty object
- [x] Empty plans list displayed after setup
- [x] User can proceed to create first plan

**Error Cases:**
- **AsyncStorage unavailable:** Show error "Storage not available, app cannot function"
- **Contact import fails:** Show error, allow manual entry
- **Validation fails (empty displayName):** Show inline error, prevent Continue until fixed

**Technical Notes:**
- Storage: `app:defaultUser` and `app:settings` are always created
- Detection: Checks if displayName="Me" AND all other User fields are empty/undefined
- Dialog: UserDialog with `isFirstLaunch={true}` prop
  - Hides Back button
  - Shows welcome section
  - Changes button text to "Continue"
  - Blocks `onRequestClose` (no back gesture)
- API: None (purely local)
- State: `isFirstLaunch` state in App.tsx
- Implementation: `checkFirstLaunch()` called in initial `useEffect`

---

## UC-02: Plans List Navigation

**Actor:** User

**Precondition:** 
- App initialized (UC-01 completed)
- User has getDefaultUser() profile
- App contains zero or more plans in app:plans

**Main Flow:**

**Initial State (No Plans):**
1. App is in main operational state Plans Display after UC-01 (User see the main screen)
2. App displays for zero plans a single screen "Create Plan Screen"
   - Large pushable "+" icon in center
   - Text: "Create new Plan"
3. App with existing plans displays the first App Plan Screen

**Navigation Between Plans:**
1. User can swipe left/right between screens
2. Order: Plans in order from app:plans array, Create Plan Screen always last (only one if no plans in app)
3. User swipes left: moves to next plan toward last Create Plan Screen (Create Plan Screen always presented)
4. User swipes right: moves to previous plan up to First
5. App displays current plan Screen (header with name, tasks list, action buttons - details covered in other UseCase)

**Success Criteria:**
- [ ] Swipe left/right navigates between plans in app:plans order
- [ ] Create Plan Screen is always available as the last screen in order; if no plans exist, Create Plan Screen is the only screen
- [ ] Plans Screens and their order are aligned with AsyncStorage Plans array 

**Technical Notes:**
- UI: Horizontal swipeable view (React Native FlatList/ScrollView with pagination)

**Error Cases:**
- No errors expected here


---

## UC-03: Create New Plan

**Actor:** User

**Precondition:** 
- App initialized (UC-01 completed)
- User has getDefaultUser() profile
- Zero or more plans exist in app:plans

**Main Flow:**

**Initial State:**
1. User is on any Plan Screen or on Create Plan Screen (accessible by swiping to last screen)

**Creating New Plan:**
1. User triggers plan creation by one of:
   - **Option A:** Swipe to Create Plan Screen and tap large "+" button
   - **Option B:** Select "Create New Plan" from Global Menu (see `app-ui.md`)
2. App generates new plan structure:
   - Basic fields:
     - `id = generateTaskId()` (generates UUID v4 - single source of truth for this plan/task)
     - `accessKey = generateAccessKey()` (UUID for sharing)
     - `title = "My Plan"` (default, user will edit)
     - `status = "new"` (TaskStatus.NEW)
     - `assigneeId = undefined`
     - `subtaskIds = []` (empty, tasks added later via UC-04)
     - `createdAt = new Date().toISOString()`
     - `updatedAt = undefined`
   - Setup "me" user:
     - `defaultUser = getDefaultUser()` get default user (displayName, email, etc.)
     - `users = {}` create empty users dictionary 
     - `meUserId = getUniqueUserId(users)` generate user ID → returns "user-1"
     - `users[meUserId] = defaultUser` add "me" user to dictionary
     - `authorId = meUserId` set "me" as author of this Plan

3. App shows "New Plan" dialog with editable fields:
   - **Title:** text input (pre-filled "My Plan", user can change)
   - **Description:** text area (optional)
   - **Buttons:**
     - `CANCEL` - dismisses dialog, nothing saved
     - `CREATE` - validates and creates plan
4. If user taps `CANCEL`:
   - Dialog closes, no plan created, use case ends
5. If user taps `CREATE`:
   - **Validation:** Title must not be empty
   - **Validation:** Title should be unique among existing plans (warn if duplicate, allow creation with User confirmation)
   - App saves plan locally and remotely:
     - Call `addPlan(planId, accessKey, meUserId)` → updates `app:plans`, stores `plan:{id}:accessKey`, `plan:{id}:meUserId`
     - POST plan to server as Task object (background, includes `users` dictionary)
     - On server success: plan marked as synced
     - On server failure: plan queued for retry, "Offline" indicator shown
6. App closes the Plan Dialog and:
   - Plan is added to FlatList `app:plans` with assigned index
   - App moves to Plan Screen of this new plan
   - User sees screen with newly created empty plan
7. Create Plan Screen remains accessible as last screen in swipe order

**Success Criteria:**
- [ ] New plan inserted into `app:plans` array
- [ ] Plan accessible via swipe navigation (before Create Plan Screen)
- [ ] AsyncStorage contains: `plan:{id}:accessKey`, `plan:{id}:meUserId` with correct values
- [ ] Plan synced to server (POST /tasks), or queued if offline
- [ ] Default user included in `plan.users` dictionary with key from getUniqueUserId()
- [ ] `plan.authorId` matches meUserId (dictionary key for "me" user)
- [ ] User sees new plan screen with chosen title with empty tasks list and "Add Task" option

**Error Cases:**
- **Empty title:** Show inline error "Plan title is required", prevent creation
- **Duplicate title:** Show warning "Plan with this name exists. Continue?", allow creation with confirmation
- **Server unavailable:** Save plan locally, queue sync, show "Offline" banner
- **AsyncStorage full/error:** Show error "Cannot save plan, storage unavailable", do not create plan

**Technical Notes:**
- **Task ID (single source of truth):**
  - `task.id` is immutable unique identifier for Task/Plan
  - Generated ONCE by `generateTaskId()` (UUID v4 format)
  - Client generates ID, server stores it (server does NOT generate IDs)
  - All references (parentId, subtaskIds, plan keys, etc.) use this exact ID
  - Format: UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
  - NO prefixes like "task:" or "plan:" - pure UUID
- **Storage:**
  - `app:plans` array updated with new plan ID (task.id of root task)
  - `plan:{id}:accessKey` stores string (UUID) - {id} is task.id
  - `plan:{id}:meUserId` stores user ID key from Plan.users dictionary (e.g., "user-1")
- **API:** POST /tasks with full Plan object including `id` field (server treats as root task with `users` dictionary)
- **User ID structure:**
  - User object does NOT have `id` field - User ID is the dictionary key in Plan.users
  - Plan.users is `Record<string, User>` (TypeScript) or `Dict[str, User]` (Python)
  - User IDs are simple strings like "user-1", "user-2" (generated by getUniqueUserId())
  - getUniqueUserId() finds max numeric suffix and returns "user-{max+1}"
  - User ID is immutable once assigned - cannot be changed, only deleted
  - Task.authorId and Task.assigneeId reference user IDs (dictionary keys)
  - meUserId in AsyncStorage identifies which dictionary key represents "me" in this plan
- **Helper methods:**
  - `generateTaskId(): string` - generates UUID for new task/plan ID
  - `generateAccessKey(): string` - generates UUID for plan sharing
  - `getUniqueUserId(users: Record<string, User>): string` - returns next available user ID for plan
  - `getTasksUsingUserId(task: Task, userId: string, allTasksMap: Map<string, Task>): Task[]` - recursively finds all tasks where userId is used as authorId or assigneeId
- **State:** Current screen index updated to show new plan
- **UI:** FlatList with horizontal pagination, new plan inserted before Create Plan Screen

---

## UC-04: Add SubTask to Plan or Task

**Actor:** User

**Precondition:**
- App initialized (UC-01 completed)
- User is viewing a Plan Screen (created via UC-03)
- Plan has at least one user (meUserId)
- User has selected parent Task (Plan or any Task in hierarchy)

**Main Flow:**

**Initial State:**
1. User is on Plan Screen viewing plan/task hierarchy

**Creating New Task:**
1. User taps "Add Task" or "Add Subtask" button on parent Task (Note: Plan is a Task, so UI may vary but operation is same)
2. App identifies parent Task (can be Plan or any Task): `parentTaskId`
3. App generates new task structure:
   - Basic fields:
     - `id = generateTaskId()` (generates UUID v4 - single source of truth for this task)
     - `title = "New Task"` (default, user will edit)
     - `status = "new"` (TaskStatus.NEW)
     - `assigneeId = undefined` (can be set in dialog)
     - `subtaskIds = []` (empty, can add subtasks later via same UC-04)
     - `createdAt = new Date().toISOString()`
     - `updatedAt = undefined`
   - Hierarchy setup:
     - Get meUserId from AsyncStorage: `meUserId = await getMeUserId(planId)`
     - Set author: `authorId = meUserId`
     - Set parent: `parentId = parentTaskId` (ID of parent Task - can be Plan ID or Task ID)
4. App shows "New Task" dialog with editable fields:
   - **Title:** text input (pre-filled "New Task", user can change)
   - **Description:** text area (optional)
   - **Assignee:** dropdown to select from plan.users (optional, default: unassigned)
   - **Buttons:**
     - `CANCEL` - dismisses dialog, nothing saved
     - `CREATE` - validates and creates task
5. If user taps `CANCEL`:
   - Dialog closes, no task created, use case ends
6. If user taps `CREATE`:
   - **Validation:** Title must not be empty
   - App saves task locally and remotely:
     - POST task to server (background) with full Task object
     - On server success: task marked as synced
     - On server failure: queue for retry, show "Offline" indicator
   - **Update parent Task hierarchy:**
     - Add taskId to `parentTask.subtaskIds` array
     - PATCH /tasks/{parentTaskId} with updated `subtaskIds`
7. App closes the Task Dialog and:
   - Task is added to local task tree
   - UI updates to show new task under parent Task
   - User sees newly created task in hierarchy

**Success Criteria:**
- [ ] New task created with correct parentId (parent Task ID)
- [ ] Task synced to server (POST /tasks), or queued if offline
- [ ] Parent Task's subtaskIds array updated locally and on server (PATCH)
- [ ] Task appears under correct parent in task hierarchy
- [ ] Task.authorId matches meUserId from AsyncStorage
- [ ] If assignee selected, Task.assigneeId is set correctly
- [ ] User sees new task with chosen title and assignee in hierarchy

**Error Cases:**
- **Empty title:** Show inline error "Task title is required", prevent creation
- **Server unavailable:** Save task locally, queue sync, show "Offline" banner
- **Parent update fails:** Task created but parent subtaskIds not updated - queue for retry

**Technical Notes:**
- **Task ID consistency:**
  - `task.id` is single source of truth, generated by `generateTaskId()` (UUID v4)
  - Client generates ID, server stores it unchanged
  - All references (parentId, subtaskIds, authorId keys, etc.) use exact task.id
  - Format: pure UUID v4 (no prefixes)
- **Functional equality:**
  - Plan IS a Task (Plan extends Task)
  - Adding task to Plan = adding task to any Task
  - No functional difference, only UI presentation differs
  - All Tasks (including Plan) have `subtaskIds` array
- **Storage:**
  - Tasks NOT stored in AsyncStorage (too many would bloat storage)
  - Only plan metadata in AsyncStorage: `app:plans`, `plan:{id}:accessKey`, `plan:{id}:meUserId`
  - Tasks fetched from server when plan opens
  - Offline queue stores pending POST/PATCH operations
- **API:**
  - POST /tasks with full Task object (including parentId)
  - PATCH /tasks/{parentTaskId} with updated subtaskIds array
  - parentTaskId can be Plan ID or any Task ID - server treats them identically
- **Hierarchy:**
  - Multi-level nesting supported (recursive)
  - Task tree built client-side from parentId/subtaskIds relationships
  - Each Task maintains subtaskIds for its direct children
- **Helper methods:**
  - `generateTaskId(): string` - generates UUID for new task ID
  - `getMeUserId(planId: string): Promise<string>` - retrieves meUserId from AsyncStorage
- **State:** Local task tree updated, UI re-renders
- **UI:** Optimistic update - task appears immediately, syncs in background

---

## UC-05: Edit Plan or Task

**Actor:** User

**Precondition:**
- App initialized (UC-01 completed)
- User is viewing a Plan Screen or Task with existing task/plan to edit
- Task or Plan already exists in system

**Main Flow:**

**Opening Edit Dialog:**
1. User is viewing Plan Screen or Task hierarchy
2. User taps **Edit icon (✏️)** next to:
   - Plan title (in Plan header), OR
   - Task title (in TaskItem component)
3. App opens **Task Dialog** in Edit mode with:
   - Title: "Edit Plan" OR "Edit Task" (based on type)
   - Pre-filled fields:
     - **Title:** current task/plan title
     - **Description:** current description (if any)
     - **Assignee:** current assigneeId (if any, shows "Unassigned" if null)
   - Buttons:
     - `CANCEL` - dismisses dialog, no changes saved
     - `SAVE` - validates and updates task/plan

**Editing:**
4. User modifies any fields:
   - Updates title text
   - Updates description text
   - Changes assignee selection from plan.users dictionary
5. If user taps `CANCEL`:
   - Dialog closes, no changes saved, use case ends
6. If user taps `SAVE`:
   - **Validation:** Title must not be empty
   - App saves changes locally and remotely:
     - Build partial update object: `{ title, description, assigneeId }`
     - PATCH /tasks/{taskId} with updated fields
     - On server success: update local state with new values
     - On server failure: queue for retry, show "Offline" indicator
7. App closes the Task Dialog and:
   - UI updates to show new title/description/assignee
   - Changes reflected immediately in task hierarchy or plan header
   - User sees updated task/plan with new values

**Success Criteria:**
- [ ] Task/Plan updated with new title, description, assigneeId
- [ ] Changes synced to server (PATCH /tasks/{id}), or queued if offline
- [ ] UI immediately reflects updated values (optimistic update)
- [ ] Edit Dialog pre-fills with current values correctly
- [ ] Validation prevents empty title
- [ ] User can edit any field independently (partial updates supported)

**Error Cases:**
- **Empty title:** Show inline error "Title is required", prevent save
- **Server unavailable:** Save changes locally, queue PATCH, show "Offline" banner
- **Task not found:** Show error "Task not found", close dialog

**Technical Notes:**
- **Functional equality:**
  - Plan IS a Task (Plan extends Task)
  - Editing Plan = editing Task with type='plan' flag
  - Same PATCH endpoint for Plans and Tasks: `/tasks/{id}`
  - UI distinguishes only for user clarity (dialog title)
- **Universal Dialog:**
  - Single TaskDialog component handles both create and edit
  - Mode: `'create'` or `'edit'`
  - Type: `'task'` or `'plan'` (affects dialog title only)
  - Same form fields for both modes (title, description, assignee)
- **API:**
  - PATCH /tasks/{taskId} with partial updates: `{ title?, description?, assigneeId? }`
  - Server applies only provided fields (Partial<Task>)
  - updatedAt timestamp set by server
- **State:** 
  - Find task/plan in local state by ID
  - Update fields with PATCH response
  - Re-render affected UI components
- **Storage:** No AsyncStorage changes (tasks not stored there)

---

## UC-06: Delete Plan or Task

**Actor:** User

**Precondition:**
- App initialized (UC-01 completed)
- User is viewing a Plan Screen or Task hierarchy
- Task or Plan exists that user wants to delete

**Main Flow:**

**Initiating Delete:**
1. User is viewing Plan Screen or Task hierarchy
2. User taps **Delete icon (red ✕)** next to:
   - Plan title (in Plan header), OR
   - Task title (in TaskItem component)
3. App calculates deletion scope:
   - Recursively collects all subtask IDs under the target task (using subtaskIds arrays)
   - Builds list: `[taskId, ...all descendant task IDs]`
   - Counts total tasks to delete

**Confirmation:**
4. App shows **Confirmation Dialog** with:
   - For Plan: "Delete this plan and all X task(s)? This cannot be undone."
   - For Task: "Delete this task and Y subtask(s)? This cannot be undone."
   - Buttons:
     - `CANCEL` - dismisses dialog, nothing deleted
     - `DELETE` (destructive style, red) - confirms deletion

**If User Taps CANCEL:**
5. Dialog closes, no deletion occurs, use case ends

**If User Taps DELETE:**
6. App performs deletion:
   - **Delete from server:**
     - Parallel DELETE requests for all task IDs: `Promise.all(idsToDelete.map(id => DELETE /tasks/{id}))`
     - Continue even if some deletes fail (offline resilience)
   - **Update parent hierarchy (if Task, not Plan):**
     - Find parent task via `task.parentId`
     - Remove taskId from `parent.subtaskIds` array
     - PATCH /tasks/{parentId} with updated subtaskIds
   - **Update local state:**
     - Remove all deleted tasks from local task tree
     - If Plan deleted: remove from plans array
     - If Task deleted: remove from parent's subtaskIds
   - **Storage cleanup (if Plan):**
     - Remove from AsyncStorage: `plan:{id}:accessKey`, `plan:{id}:meUserId`
     - Remove planId from `app:plans` array
     - Call `removePlan(planId)` helper

7. If **Plan deleted:**
   - App navigates away from deleted Plan Screen
   - Scrolls to previous plan (index - 1) or first plan
   - Plan no longer appears in horizontal plan list
   - User sees remaining plans, deleted plan is gone

8. If **Task deleted:**
   - Task (and all subtasks) removed from hierarchy
   - Parent task's subtask list updated
   - UI re-renders without deleted tasks
   - User sees updated hierarchy without deleted branch

9. App shows success message: "Deleted X task(s)"

**Success Criteria:**
- [ ] All tasks recursively deleted from server (DELETE /tasks/{id} for each)
- [ ] If Task: Parent's subtaskIds updated (PATCH /tasks/{parentId})
- [ ] If Plan: AsyncStorage cleaned up (plan metadata removed)
- [ ] If Plan: App navigates away from deleted plan
- [ ] Local state updated (tasks removed from tree, plan removed from list)
- [ ] UI reflects deletion immediately (no ghost tasks/plans)
- [ ] Confirmation shows accurate count of tasks to be deleted
- [ ] User cannot accidentally delete without confirmation

**Error Cases:**
- **Server unavailable:** Delete locally, queue server deletes for retry, show "Offline" banner
- **Partial delete failure:** Some tasks deleted, others queued - show warning "Some deletions pending"
- **Task not found:** Skip deletion for missing tasks, continue with others

**Technical Notes:**
- **Recursive Collection:**
  - `collectTaskIdsToDelete(taskId, taskMap)` recursively gathers IDs
  - Follows subtaskIds arrays to build complete deletion list
  - Works for any nesting depth (unlimited hierarchy)
- **Functional equality:**
  - Plan IS a Task (Plan extends Task)
  - Deleting Plan = deleting root Task + cleanup
  - Same DELETE endpoint: `/tasks/{id}` for Plans and Tasks
  - Extra steps for Plan: AsyncStorage cleanup, navigation, plan list update
- **Server Operations:**
  - DELETE /tasks/{id} for each task (parallel with Promise.all)
  - PATCH /tasks/{parentId} if task has parent (update subtaskIds)
  - No separate "delete plan" endpoint - Plan is just a Task
- **Storage:**
  - Plans: Remove from AsyncStorage (app:plans list, accessKey, meUserId)
  - Tasks: No AsyncStorage to clean (tasks not stored locally)
- **Navigation:**
  - If Plan deleted: scroll FlatList to safe index (prev plan or index 0)
  - If Task deleted: stay on same screen, just remove task from tree
- **State:**
  - Filter deleted task IDs from local task tree
  - Remove plan from plans array (if Plan deleted)
  - Update parent's subtaskIds to exclude deleted taskId
- **UI:**
  - Destructive action styling (red color) for delete icon and button
  - Confirmation required (Alert.alert with destructive style)
  - Optimistic update: remove from UI immediately after confirmation

---

## UC-07: Application Startup (Initialized App) ✅

**Status:** IMPLEMENTED

**Actor:** Returning User

**Precondition:** 
- App has been launched before and initialized
- AsyncStorage contains `app:defaultUser` with valid user profile
- If AsyncStorage not contains `app:defaultUser`  → redirect to UC-01: First Launch

**Main Flow:**
1. User launches the application
2. App shows loading indicator
3. App checks initialization status:
   - Reads `app:defaultUser` from AsyncStorage
   - If `app:defaultUser` not exists in AsyncStorage → **Redirect to UC-01**
   - If user profile is initialized → continue
4. App loads plan list from AsyncStorage:
   - Reads `app:plans` key (array of plan IDs: `[planId1, planId2, ...]`)
   - If `app:plans` is empty or missing → go to step 8 (no plans scenario)
5. For each plan ID in `app:plans`, app prepares Plan Screen metadata:
   - Reads `plan:{planId}:accessKey` - Security key for plan access
   - Reads `plan:{planId}:meUserId` - User ID representing current user in plan.users
   - Creates screen object:
     ```typescript
     {
       type: 'plan',
       planId: string,                 // task.id of root plan task
       accessKey: string,              // from AsyncStorage
       meUserId: string,               // from AsyncStorage
       lastUpdateTimestamp: 0,         // never refreshed yet
       taskMap: Map<string, Task>(),   // no tasks loaded yet (Map for fast lookup)
       isRefreshing: false,            // no refresh in progress initially
     }
     ```
   - **Note:** No server fetch happens at this stage (performance optimization)
6. App adds "Create Plan Screen" as the last screen in navigation
7. App displays default screen:
   - If `plans.length > 0`:
     - Shows first Plan Screen (index 0)
     - Plan Screen triggers lazy load (see UC-08)
   - If `plans.length === 0`:
     - Shows "Create Plan Screen"
     - User can create their first plan
8. App is ready for user interaction:
   - User can swipe between screens
   - User can access global menu (☰)
   - Plan data loads on demand when screen is displayed (UC-08)

**Alternative Flow A: No plans in AsyncStorage**

*Trigger: Step 4 - `app:plans` is empty array or not present*

1. System creates empty plans array
2. Shows "Create Plan Screen" as the only screen
3. User can create their first plan (UC-03)

**Alternative Flow B: AsyncStorage corrupted or unreadable**

*Trigger: Step 4 - AsyncStorage read fails*

1. System logs error to console
2. For individual plan metadata errors:
   - If `plan:{planId}:accessKey` missing → skip plan, log warning
   - If `plan:{planId}:meUserId` missing → skip plan, log warning
   - Continue loading remaining plans
3. If critical data missing (`app:plans` or `app:defaultUser` corrupted):
   - Shows error Alert: "Failed to load data. Try clearing app data."
   - Offers "Open Settings" button → opens AboutDialog
   - User can use "Clear All App Data" button
4. After clearing → restart app → UC-01 (first launch flow)

**Success Criteria:**
- [x] App checks initialization before loading plans
- [x] Plan list loaded exclusively from AsyncStorage (not server)
- [x] No server requests during startup (fast launch)
- [x] Plan Screens prepared with metadata only (tasks not loaded)
- [x] Each Plan Screen has `lastUpdateTimestamp = 0`
- [x] First Plan Screen or Create Plan Screen displayed
- [x] User can swipe between screens immediately
- [x] Task data loading deferred to UC-08 (lazy loading)

**Error Cases:**
- **AsyncStorage unavailable:** Show error "Storage not available", offer Clear Data
- **Corrupted plan data:** Skip corrupted plans, log warnings, continue with valid plans
- **No plans found:** Show Create Plan Screen (not an error)

**Technical Notes:**
- **AsyncStorage Keys Used:**
  ```typescript
  "app:defaultUser"              → User object (profile)
  "app:plans"                    → string[] (array of plan IDs)
  "plan:{planId}:accessKey"      → string (security key)
  "plan:{planId}:meUserId"       → string (user ID in plan.users)
  ```
- **Screen State After Startup - Example:**
  ```typescript
  screens = [
    {
      type: 'plan',
      planId: 'uuid-1',
      accessKey: 'key-1',
      meUserId: 'user-1',
      lastUpdateTimestamp: 0,
      taskMap: Map<string, Task>(),
      isRefreshing: false,
    },
    {
      type: 'plan',
      planId: 'uuid-2',
      accessKey: 'key-2',
      meUserId: 'user-2',
      lastUpdateTimestamp: 0,
      taskMap: Map<string, Task>(),
      isRefreshing: false,
    },
    {
      type: 'create',
    },
  ];
  currentIndex = 0; // First Plan Screen
  ```
- **Performance:**
  - Fast startup: No network requests during launch
  - Lazy loading: Tasks fetched only when screen is viewed (UC-08)
  - Cached metadata: AsyncStorage reads are fast and synchronous
- **Related Files:**
  - `client/src/App.tsx` - Main app component with startup logic
  - `client/src/storage/app.ts` - AsyncStorage helpers (getPlans, getPlan)

---

## UC-08: Display Plan Screen (Lazy Load & Refresh) ✅

**Status:** IMPLEMENTED

**Actor:** User

**Precondition:**
- App is running and initialized (UC-07 completed)
- Plan Screen exists with metadata:
  - `planId` (task.id of root plan task)
  - `accessKey` (security key)
  - `meUserId` (current user's ID in plan.users)
  - `lastUpdateTimestamp` (timestamp of last refresh, initially 0)
  - `taskMap` (Map<string, Task> keyed by taskId, initially empty)
  - `isRefreshing` (boolean flag, initially false)

**Main Flow:**
1. Plan Screen becomes visible:
   - **Trigger A:** App startup shows first Plan Screen (from UC-07)
   - **Trigger B:** User swipes to Plan Screen
   - **Trigger C:** User returns to app from background
2. System checks if refresh is needed:
   - Gets current time: `now = Date.now()`
   - Gets screen's `lastUpdateTimestamp`
   - Gets `refreshTimeout` from app settings (default: `10000` ms = 10 seconds)
   - Calculates: `shouldRefresh = (now - lastUpdateTimestamp) > refreshTimeout`
3. System decides on refresh:
   - **If `shouldRefresh === true`** → continue to step 4 (fetch from server)
   - **If `shouldRefresh === false`** → skip to step 7 (use cached data)
4. System fetches plan data from server using the existing `/tasks` endpoint with recursive option:
   - Sets `screen.isRefreshing = true`
   - Shows subtle loading indicator: small ActivityIndicator in plan header (right side), light color, doesn't block swipe gestures
   - Calls `GET /tasks?planId={planId}&recursive=true` which returns the root plan task and all its descendant tasks in one response.
   - Server behaviour:
     - Accepts the plan root task id (`planId`) and recursively resolves all tasks whose `parentId` is the plan or any descendant.
     - Returns a JSON object `{ items: [ ...tasks ], total: N }` where `items` contains the root plan and all descendant tasks (order is unspecified; client may reorder as needed).
   - Client then converts the returned task list into the per-screen `taskMap` (map of `taskId -> Task`).
5. System updates screen state:
  - Populates `screen.taskMap` with fetched tasks (Map keyed by `taskId`)
  - Sets `screen.lastUpdateTimestamp = Date.now()`
  - Sets `screen.isRefreshing = false`
  - **Data merge strategy** (handles conflicts between server and local data):
     - **Plan-level fields:** Server data wins (title, description, status, subtaskIds, etc.)
     - **accessKey:** Always from AsyncStorage (never overwritten by server)
     - **users dictionary:** Merge both sources (local additions + server users preserved)
     - **Task fields:** Server data takes precedence (assumes server is source of truth)
     - **Conflict resolution:** Last-write-wins based on `updatedAt` timestamp (server typically newer)
     - **Local-only changes:** If task has unsaved local edits (pending sync), preserve those until sync completes
6. System renders Plan Screen:
   - Shows plan header with title and assignee pill
   - Renders task list from `taskMap` (root tasks + subtasks recursively using TaskItem)
   - Shows "Add Task" button
   - Shows Plan Context Menu (⋮) if plan is valid
   - Hides loading indicator (ActivityIndicator removed)
   - If `taskMap` is empty after successful fetch: shows empty state "No tasks yet. Tap + to add first task"
7. Screen is ready for user interaction:
   - User can view tasks from `taskMap`
   - User can add/edit/delete tasks (UC-04, UC-05, UC-06)
   - User can manage plan users (Plan Context Menu → Users)
   - **Local changes behavior:**
     - Add/edit/delete operations update `taskMap` immediately (optimistic update)
     - Changes trigger server sync in background (POST/PATCH/DELETE)
     - `lastUpdateTimestamp` is NOT updated on local changes (allows next refresh to detect remote changes)
     - Refresh will merge local pending changes with server data (local unsaved edits preserved)

**Alternative Flow A: Server fetch fails (no network)**

*Trigger: Step 4 - API call fails (network error, timeout)*

1. System logs error to console
2. If `screen.taskMap` has cached entries (map size > 0):
  - Shows cached data from `taskMap`
  - Displays warning banner: "⚠️ Using offline data"
  - Sets `lastUpdateTimestamp = Date.now()` (retry after timeout)
3. If `screen.taskMap` is empty (no cached data):
  - Shows empty state: "📡 Cannot load plan (offline)"
  - Offers "Retry" button
  - User can tap retry to attempt refresh again (returns to step 4)

**Alternative Flow B: Plan not found on server (deleted remotely)**

*Trigger: Step 4 - Server returns 404 or plan ID not in task list*

1. System shows Alert: "Plan Not Found"
   - Message: "This plan no longer exists on the server"
2. Offers options:
   - **Remove from My Plans**: Removes plan ID from AsyncStorage
   - **Keep Local Data**: Keeps plan in list (offline mode, cached data only)
3. If user chooses "Remove":
   - Calls `removePlan(planId)` to delete from AsyncStorage
   - Navigates to next screen or Create Plan Screen
   - Updates screen list (removes plan from navigation)

**Alternative Flow C: Refresh already in progress**

*Trigger: Step 2 - Another refresh is already running (screen.isRefreshing === true)*

1. System skips new refresh request (avoids duplicate concurrent requests)
2. Shows current loading indicator (from ongoing refresh)
3. User sees cached data from `taskMap` during refresh
4. When ongoing refresh completes, UI updates with new data

**Implementation note:**
```typescript
if (screen.isRefreshing) {
  // Don't start another refresh, existing one will complete
  return;
}
```

**Success Criteria:**
- [x] First display always refreshes (lastUpdateTimestamp = 0)
- [x] Subsequent displays check refresh timeout before fetching
- [x] Cached data used if within timeout period (fast navigation)
- [x] Refresh timeout is configurable (default 10 seconds)
- [x] Loading indicator shown during refresh (subtle, non-blocking)
- [x] Offline mode: cached data displayed with warning banner
- [x] Local changes (users, accessKey) preserved during merge
- [x] Failed refresh doesn't prevent using cached data
- [x] Background/foreground transitions trigger refresh check

**Error Cases:**
- **Network timeout:** Use cached data, show offline banner, retry after timeout
- **Server error (500):** Use cached data, show error banner, retry after timeout
- **Invalid response:** Log error, use cached data, show error banner
- **No cached data + offline:** Show empty state with retry button

**Technical Notes:**
- **Refresh Timeout Configuration:**
  ```typescript
  const APP_SETTINGS = {
    refreshTimeout: 10000, // 10 seconds (milliseconds)
  };
  
  const shouldRefresh = (Date.now() - lastUpdateTimestamp) > APP_SETTINGS.refreshTimeout;
  ```
**API Call (recommended server support):**
  ```typescript
  // Use the existing /tasks endpoint with recursive option to return plan + descendants
  // Example: GET /tasks?planId={planId}&recursive=true
  const response = await fetch(`${SERVER}/tasks?planId=${planId}&recursive=true`);
  if (!response.ok) throw new Error(`Failed to fetch plan tasks: ${response.status}`);
  const result = await response.json();
  // result.items is an array containing the root plan task and all descendant tasks
  const planTasks = result.items as Task[];

  // Build taskMap (cache) for the screen
  const taskMap = new Map<string, Task>();
  planTasks.forEach(t => taskMap.set(t.id, t));
  // Assign into screen.taskMap
  screen.taskMap = taskMap;
  ```
- **Data Merge Strategy:**
  ```typescript
  // Merge server data with local data
  const mergedPlan = {
    ...serverPlan,              // Server data (tasks, title, description, etc.)
    users: {
      ...serverPlan.users,      // Server users
      ...localPlan.users,       // Local additions (preserved)
    },
    accessKey: localPlan.accessKey, // Always from AsyncStorage
  };
  ```
- **Screen State:**
  ```typescript
  interface PlanScreenState {
    planId: string;
    accessKey: string;
    meUserId: string;
    lastUpdateTimestamp: number;   // Unix timestamp (ms)
    taskMap: Map<string, Task>;  // Cached tasks
    isRefreshing: boolean;         // Refresh in progress flag
  }
  ```
- **Performance Optimization:**
  - **Lazy loading:** Only load data when screen is visible
  - **Caching:** Use cached data within timeout period
  - **Debouncing:** Prevent multiple simultaneous refreshes (via isRefreshing flag)
  - **Non-blocking UI:** Subtle loading indicator, don't block interaction
- **React Native Lifecycle Hooks:**
  ```typescript
  // Detect when screen becomes visible (swipe navigation)
  import { useFocusEffect } from '@react-navigation/native';
  
  useFocusEffect(
    useCallback(() => {
      checkAndRefreshIfNeeded();
    }, [planId])
  );
  
  // Detect app returning from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkAndRefreshIfNeeded();
      }
    });
    return () => subscription.remove();
  }, []);
  ```
- **Related Files:**
  - `client/src/App.tsx` - Screen rendering, navigation, refresh logic
  - `client/src/api.ts` - Server API calls (fetchAllTasks)
  - `client/src/storage/app.ts` - AsyncStorage helpers (getPlan)

---

## Proposed Use Cases to Implement

### Core Functionality
- [x] **UC-01: First App Launch & Setup** *(completed)*
- [x] **UC-02: Plans Management & Navigation** *(completed)*
- [x] **UC-03: Create New Plan** *(completed)*
- [x] **UC-04: Add Task to Plan** *(completed)*
- [x] **UC-05: Edit Plan or Task** *(completed)*
- [x] **UC-06: Delete Plan or Task** *(completed)*
- [x] **UC-07: Application Startup (Initialized App)** *(completed)*
- [x] **UC-08: Display Plan Screen (Lazy Load & Refresh)** *(completed)*

- [ ] **UC-09: Update Task Status**
  - User marks task as done/in-progress/blocked
  - Status synced
  - Other participants see updates

### Collaboration
- [ ] **UC-10: Share Plan via Access Key**
  - User views accessKey for plan
  - Copy to clipboard or share via system share sheet
  - Recipient can use key to join

- [ ] **UC-11: Join Existing Plan**
  - User receives accessKey (link, QR code, or manual entry)
  - User enters key in app
  - App fetches plan from server
  - User selects or creates their identity in plan

- [ ] **UC-12: Add Participant to Plan**
  - User adds new user to Plan.users
  - New user available for task assignment
  - Synced to server

- [ ] **UC-13: Change "Me" User in Plan**
  - User switches which participant represents them
  - Local meUserId updated
  - UI updates to show correct "assigned to me" tasks

### Data Management
- [ ] **UC-14: Refresh Plan Data**
  - User pulls to refresh
  - App fetches latest tasks from server
  - Local data updated
  - Conflicts resolved (last-write-wins)

- [ ] **UC-15: Offline Plan Creation**
  - User creates plan while offline
  - Plan saved locally
  - App queues sync operation
  - Auto-syncs when connection restored

- [ ] **UC-16: Remove Plan from App**
  - User removes plan from local list
  - Plan data removed from AsyncStorage
  - Server data unaffected (plan still exists)

### Settings & Profile
- [ ] **UC-17: Edit Default User Profile**
  - User updates their default profile
  - Used for new plans going forward
  - Existing plans unaffected

- [ ] **UC-18: Clear All App Data**
  - Developer/tester clears all local data
  - Fresh start without reinstalling
  - Confirmation required

---

## Notes for Implementation
- UC-01 through UC-08 completed (core CRUD + startup/display)
- UC-10, UC-11 (collaboration via accessKey) are critical for multi-user features
- UC-15 (offline) can be deferred if complex
- UC-18 is dev-only, already implemented in AboutDialog

---

## Next Steps
1. ✅ Completed UC-01 through UC-08 (Plans, Tasks CRUD, Startup, Display)
2. Next priority: UC-10, UC-11 (Collaboration features)
3. Consider UC-09 (Task Status) for workflow management
4. Use use cases to drive further technical design
