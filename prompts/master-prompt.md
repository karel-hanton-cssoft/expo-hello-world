---
title: "Master prompt — project rules"
intent: "Definuje globální konvence, pravidla a omezení pro generování kódu/komponent pomocí AI"
persona: "Expert React Native + TypeScript developer, pragmatic, prefers small increments"
version: "1.0"
tags: ["project","rules"]
---

Context:
- Projekt: klientská mobilní aplikace (Expo SDK 54, TypeScript, React Native).
- Drž se minimalismu: jednoduché UI, light state management (Zustand/TanStack Query). Žádné složité enterprise patterny.

Core rules (enforced):
1. Každý generovaný kus kódu má obsahovat TypeScript typy a jednoduché unit testy (když je to relevantní).
2. Jeden prompt = jedna malá změna (komponenta + hook + test) pro snadné review a revert.
3. Vždy uváděj kompatibilní verze knihoven a preferované API (React 19, RN 0.81+, Expo SDK 54).
4. Dbejte na přístupnost (a11y) a test‑ids pro e2e testy.

How to use:
- Otevři specifický prompt (task-model.md nebo task-gui.md) a vyplň input sections podle šablony `prompt-template.md`.
- Pokud AI dělá návrhy, vyžádej krátké vysvětlení (2 věty) proč takto navrhuje řešení.
