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
     - `id = generateTaskId()` (generates UUID for plan)
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
- **Storage:**
  - `app:plans` array updated with new plan ID
  - `plan:{id}:accessKey` stores string (UUID)
  - `plan:{id}:meUserId` stores user ID key from Plan.users dictionary (e.g., "user-1")
- **API:** POST /tasks with full Plan object (server treats as root task with `users` dictionary)
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



## Proposed Use Cases to Implement

### Core Functionality
- [x] **UC-01: First App Launch & Setup** *(completed above)*
- [x] **UC-02: Plans Management & Navigation** *(completed above)*
- [ ] **UC-03: View Plan Details**
  - User opens plan from list
  - See plan info, tasks tree, participants
  - Identify which user is "me"

- [ ] **UC-04: Add Task to Plan**
  - User creates new task under plan or existing task
  - Task saved and synced
  - Subtask relationships maintained

- [ ] **UC-05: Edit Task**
  - User updates task title, description, status, assignee
  - Changes synced to server
  - Other participants see updates

- [ ] **UC-06: Delete Task**
  - User removes task (and optionally subtasks)
  - Deletion synced
  - Plan structure updated

### Collaboration
- [ ] **UC-07: Share Plan via Access Key**
  - User views accessKey for plan
  - Copy to clipboard or share via system share sheet
  - Recipient can use key to join

- [ ] **UC-08: Join Existing Plan**
  - User receives accessKey (link, QR code, or manual entry)
  - User enters key in app
  - App fetches plan from server
  - User selects or creates their identity in plan

- [ ] **UC-09: Add Participant to Plan**
  - User adds new user to Plan.users
  - New user available for task assignment
  - Synced to server

- [ ] **UC-10: Change "Me" User in Plan**
  - User switches which participant represents them
  - Local meUserId updated
  - UI updates to show correct "assigned to me" tasks

### Data Management
- [ ] **UC-11: Refresh Plan Data**
  - User pulls to refresh
  - App fetches latest tasks from server
  - Local data updated
  - Conflicts resolved (last-write-wins)

- [ ] **UC-12: Offline Plan Creation**
  - User creates plan while offline
  - Plan saved locally
  - App queues sync operation
  - Auto-syncs when connection restored

- [ ] **UC-13: Remove Plan from App**
  - User removes plan from local list
  - Plan data removed from AsyncStorage
  - Server data unaffected (plan still exists)

### Settings & Profile
- [ ] **UC-14: Edit Default User Profile**
  - User updates their default profile
  - Used for new plans going forward
  - Existing plans unaffected

- [ ] **UC-15: Clear All App Data**
  - Developer/tester clears all local data
  - Fresh start without reinstalling
  - Confirmation required

---

## Notes for Implementation
- Start with UC-01, UC-02, UC-03 (core flow)
- UC-08 (join plan) is critical for collaboration
- UC-12 (offline) can be deferred if complex
- UC-15 is dev-only, low priority for MVP

---

## Next Steps
1. Review and refine this list
2. Create detailed use cases for each item
3. Use use cases to drive app-flow.md technical design
4. Implement features based on priority
