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

## UC-01: First App Launch & Setup

**Actor:** New User

**Precondition:** 
- App freshly installed
- No previous data in AsyncStorage

**Main Flow:**
1. User opens app for the first time
2. App detects First Start (no default user exists, no other app data are stored)
3. App shows welcome screen with default profile (id="defaultUser", displayName="Me")
4. App prompts user: "Let's set up your profile"
5. User edits displayName to "John", optionally adds email or phone number 
   - None is required ("Me" is used in such case)
6. User taps "Continue"
7. App saves updated profile via setDefaultUser()
8. App saves default App Settings
   - saves empty App-settings object "{}" - reserved for future to add items
9. App get to main operational state Plans Display
    - for first time shows empty plans list with function "Create Plan" function.

**Success Criteria:**
- [ ] Default user created automatically on first launch
- [ ] User can edit profile before continuing
- [ ] Profile persists in AsyncStorage (app:defaultUser)
- [ ] App settings persists in AsyncStorage (app:settings) (as empty object)
- [ ] Empty plans list displayed
- [ ] User can proceed to create first plan

**Error Cases:**
- **AsyncStorage unavailable:** Show error "Storage not available, app cannot function"
- **User skips profile setup:** Allow continuation with warning; user can update profile later in settings

**Technical Notes:**
- Storage: `app:defaultUser` and `app:settings` are always created (at least with default values)
- API: None (purely local)
- State: App ready for plan creation

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

## Proposed Use Cases to Implement

### Core Functionality
- [x] **UC-01: First App Launch & Setup** *(completed)*
- [x] **UC-02: Plans Management & Navigation** *(completed)*
- [x] **UC-03: Create New Plan** *(completed)*
- [x] **UC-04: Add Task to Plan** *(completed)*
- [x] **UC-05: Edit Plan or Task** *(completed)*
- [x] **UC-06: Delete Plan or Task** *(completed)*

- [ ] **UC-07: Update Task Status**
  - User marks task as done/in-progress/blocked
  - Status synced
  - Other participants see updates

### Collaboration
- [ ] **UC-08: Share Plan via Access Key**
  - User views accessKey for plan
  - Copy to clipboard or share via system share sheet
  - Recipient can use key to join

- [ ] **UC-09: Join Existing Plan**
  - User receives accessKey (link, QR code, or manual entry)
  - User enters key in app
  - App fetches plan from server
  - User selects or creates their identity in plan

- [ ] **UC-10: Add Participant to Plan**
  - User adds new user to Plan.users
  - New user available for task assignment
  - Synced to server

- [ ] **UC-11: Change "Me" User in Plan**
  - User switches which participant represents them
  - Local meUserId updated
  - UI updates to show correct "assigned to me" tasks

### Data Management
- [ ] **UC-12: Refresh Plan Data**
  - User pulls to refresh
  - App fetches latest tasks from server
  - Local data updated
  - Conflicts resolved (last-write-wins)

- [ ] **UC-13: Offline Plan Creation**
  - User creates plan while offline
  - Plan saved locally
  - App queues sync operation
  - Auto-syncs when connection restored

- [ ] **UC-14: Remove Plan from App**
  - User removes plan from local list
  - Plan data removed from AsyncStorage
  - Server data unaffected (plan still exists)

### Settings & Profile
- [ ] **UC-15: Edit Default User Profile**
  - User updates their default profile
  - Used for new plans going forward
  - Existing plans unaffected

- [ ] **UC-16: Clear All App Data**
  - Developer/tester clears all local data
  - Fresh start without reinstalling
  - Confirmation required

---

## Notes for Implementation
- UC-01 through UC-06 completed (core CRUD operations)
- UC-08, UC-09 (collaboration via accessKey) are critical for multi-user features
- UC-13 (offline) can be deferred if complex
- UC-16 is dev-only, low priority for MVP

---

## Next Steps
1. ✅ Completed UC-01 through UC-06 (Plans, Tasks CRUD)
2. Next priority: UC-08, UC-09 (Collaboration features)
3. Consider UC-07 (Task Status) for workflow management
4. Use use cases to drive further technical design
