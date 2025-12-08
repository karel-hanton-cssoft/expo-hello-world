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

## UC-03: Plans Management

**Actor:** User

**Precondition:** 
- App initialized (UC-01 completed)
- User has getDefaultUser() profile
- Zero (A) or more (B) plans exist in app:plans

**Main Flow:**

**Initial State (No Plans):**
1. App is in main operational state Plans Display after UC-01 (User see the main screen)
2. App displays:
   A) single screen: "Create Plan Screen"
      - Large pushable "+" icon in center
      - Text: "Create new Plan"
   B) first App Plan Screen
3. User swipes left/right - no other screens available

**Creating First Plan:**
4. User taps "+" on Create Plan Screen
5. App prompts: "Plan name?" (default: "New Plan")
6. User enters plan name (e.g., "Shopping")
7. User taps "Create"
8. App generates new plan:
   - `planId = generateUserId()` (reusing UUID generator)
   - `accessKey = generateAccessKey()`
   - `title = "Shopping"`
   - `status = "new"`
   - `authorId = defaultUser.id`
   - `subtaskIds = []`
   - `users = [defaultUser]` (full User object)
   - `createdAt = now()`
9. App saves plan locally:
   - POST plan to server (background)
   - On success: save to AsyncStorage via `addPlan(planId, accessKey, defaultUser.id)`
   - On failure: queue for retry, still save locally
10. App navigates to new Plan Screen (shows plan details)
11. Create Plan Screen is now accessible by swiping right (always last)

**Navigation Between Plans:**
12. User swipes left: moves to next plan (or Create Plan Screen if last)
13. User swipes right: moves to previous plan
14. Order: Plans in order from app:plans array, Create Plan Screen always last
15. App displays current plan: header with name, tasks list, action buttons

**Creating Additional Plans:**
16. User swipes to Create Plan Screen (last screen, always available)
17. User taps "+" and repeats steps 5-10
18. New plan inserted before Create Plan Screen in swipe order

**Success Criteria:**
- [ ] Create Plan Screen always exists and is always last in swipe order
- [ ] After first plan created, user can swipe between Plan Screen and Create Plan Screen
- [ ] Each plan occupies full screen with header showing plan name
- [ ] Swipe left/right navigates between plans in app:plans order
- [ ] New plans saved to AsyncStorage and synced to server
- [ ] Each plan has unique planId, accessKey, and meUserId set correctly

**Error Cases:**
- **Server unavailable during creation:** Save plan locally, queue sync, show "Offline" indicator
- **AsyncStorage full:** Show error "Storage full, cannot create plan"
- **Empty plan name:** Use default "New Plan" or "Plan N" (N = count + 1)

**Technical Notes:**
- Storage: `app:plans` array updated, `plan:{id}:accessKey` and `plan:{id}:meUserId` created
- API: POST /tasks with full plan object (Plan extends Task)
- State: Current plan index tracked (for swipe navigation)
- UI: Horizontal swipeable view (React Native FlatList/ScrollView with pagination)

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
