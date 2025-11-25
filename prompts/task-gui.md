---
title: "Task GUI prompt"
intent: "Poprosit AI vygenerovat UI komponenty pro zobrazení a interakci s Taskem"
persona: "Senior React Native component author — focus on accessibility and small scope"
version: "1.0"
tags: ["component","ui","task"]
---

Context
- Use the Task model defined in task-model.md. Keep UI portable between mobile and web via Expo React Native Web.

Task
1. Create a `TaskCard.tsx` React Native TypeScript component with props: task: Task, onToggleComplete, onOpen, onAssign.
2. Provide styles via StyleSheet and ensure responsive layout for mobile and web width≥600.
3. Add accessibilityLabel and testIDs for major elements.
4. Provide one unit test example (react‑testing‑library) that checks render + button callback.

Output
- A TSX component file, a matching style object, and a unit test file. Add a 2‑sentence rationale for design choices.

Acceptance criteria
- Component compiles, test passes in a standard setup (jest + testing-library). Design is minimal but usable.
