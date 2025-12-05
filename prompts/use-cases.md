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
2. App detects no default user exists (getDefaultUser() creates one)
3. App shows welcome screen with default profile (id="defaultUser", displayName="Me")
4. App prompts: "Let's set up your profile"
5. User edits displayName to "John" and adds email "john@example.com"
6. User taps "Continue"
7. App saves updated profile via setDefaultUser()
8. App shows empty plans list with "Create Plan" button

**Success Criteria:**
- [ ] Default user created automatically on first launch
- [ ] User can edit profile before continuing
- [ ] Profile persists in AsyncStorage (app:defaultUser)
- [ ] Empty plans list displayed
- [ ] User can proceed to create first plan

**Error Cases:**
- **AsyncStorage unavailable:** Show error "Storage not available, app cannot function"
- **User skips profile setup:** Allow with default values, can edit later in settings

**Technical Notes:**
- Storage: `app:defaultUser` created
- API: None (purely local)
- State: App ready for plan creation

---

## Proposed Use Cases to Implement

### Core Functionality
- [ ] **UC-01: First App Launch & Setup** *(example above)*
- [ ] **UC-02: Create New Plan**
  - User creates plan from scratch
  - Plan saved locally and synced to server
  - User becomes first plan participant

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
