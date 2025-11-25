---
title: "Task model prompt"
intent: "Navrhnout jednoduchý, rozšiřitelný JSON/TypeScript model pro Tasky"
persona: "Backend/Fullstack dev — návrh robustního, jednoduchého modelu"
version: "1.0"
tags: ["model","api"]
---

Context
- App is a light household task/sharing app (inspiration: Settle Up). Tasks must be hierarchical and shareable with groups.
- Current goal = minimal viable model for client-only work: compact, simple fields.

Task (requirements)
1. Provide a TypeScript interface for Task with minimal fields (id, title, status, parentId, assigneeId, planId, dueDate, createdAt, updatedAt).
2. Include optional metadata object for extensibility (tags, estimatedMinutes).
3. Provide example JSON payloads for: create, update, response (list). Use ISO timestamps.
4. Describe validation rules and constraints (title non-empty, status enum, date formats), plus sorting/ordering guidance.

Output
- Return a TypeScript interface (single file) and JSON schema example (create/update/response) and short notes (2–4 bullet points) about migration/compatibility.

Acceptance criteria
- Interface compiles in TypeScript and matches JSON examples. No ambiguous fields. Extensible but minimal.
