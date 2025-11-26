---
title: "Master prompt — project rules"
intent: "Definuje globální konvence, pravidla a omezení pro generování kódu/komponent pomocí AI"
persona: "Expert React Native + TypeScript developer, pragmatic, prefers small increments, tries keep things simple"
version: "1.0"
tags: ["project","rules"]
---

Context:
- Projekt: klientská mobilní aplikace (Expo SDK 54, TypeScript, React Native).
- Purpose: light household task manager (not an enterprise system). High-level domain model (tasks, plans, shares) and specific UI flows live in area prompts (`task-model.md`, `client-ui.md`).

Core rules (enforced):
1. Každý generovaný kus kódu má obsahovat TypeScript typy a jednoduché unit testy (když je to relevantní).
2. Jeden prompt = jedna malá změna (komponenta + hook + test) pro snadné review a revert.
3. Vždy uváděj kompatibilní verze knihoven a preferované API (React 19, RN 0.81+, Expo SDK 54).
4. Dbejte na přístupnost (a11y) a test‑ids pro e2e testy.
5. Vývoj probíhá od promptů ke kódu: každý prompt je malý, přesný specifikační artefakt, ze kterého AI vygeneruje konkrétní změnu.

How to use:
- Rozhodnout se jakou změnu budu vyvíjet.
- Vytvořit git věrtev pro tuto změnu.
- Já/Autor provede prvotní úpravu příslušného promptu - případně doplní prompt nový podle šablony `prompt-template.md`.
- AI posoudí kvalitu promptu a doporučí změny a doplnění.
- Pro všechny AI návrhy je vyžadováno krátké vysvětlení (2 věty) proč takto navrhuje řešení.
- Po iteracích nad prompty pokusí se AI upravit zdrojový kód
- Po úspěšném vyzkoušení přes Expo Go se udělá merge vetvě do main

Scope & responsibilities
- Master prompt contains only project‑level rules, constraints and conventions that apply globally across prompts and generated code. Examples: supported SDK and dependency policy, testing/CI rules, PR size conventions, accessibility baseline, and versioning strategy.
- Do NOT put detailed implementation specs or feature-level modeling here — those belong into area prompts (e.g. `task-model.md`, `task-gui.md`, `client-ui.md`, `share-security.md`). Master should reference these prompts but not repeat their detailed content.

PR / Review & CI conventions
- One prompt = one PR (small, focused change). PR should include:
  - reference to the prompt file and version
  - acceptance criteria + short manual verification steps
  - at least one unit or integration test if code behaviour changes
- CI must run: lint, typecheck, unit tests — PRs that change platform API or build config require additional manual review.

Project conventions (recommended)
- Folder layout: keep a predictable structure in client/:
  - src/screens — route screens
  - src/components — reusable presentational components
  - src/hooks — composable logic hooks
  - src/services or src/api — API clients/adapters
  - src/models — TypeScript interfaces and types
- Code style: TypeScript strict mode, prettier formatting, ESLint rules. Keep changes small and incremental.
- Tests: each behaviour change must add at least one unit test; components should include a lightweight render test (jest + testing-library).
- Commits & PRs: use short, conventional messages (feat|fix|chore) and link the prompt file + version in PR description. Keep PRs focused and small.
- Accessibility baseline: interactive elements must include an a11y label and testIDs for key flows.



