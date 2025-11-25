---
title: "<Short human title>"
intent: "<Why we ask the AI — goal>"
persona: "<Who the AI should pretend to be — e.g. Senior React Native Engineer>"
version: "1.0"
tags: ["component", "api", "model"]
inputs:
  - name: <inputName>
    type: <type>
    example: <value>
outputs:
  - type: code
    languages: ["TypeScript", "JSX"]
 acceptance_criteria:
  - "List of checks the output must pass"
  - "Behavioural / performance / accessibility checks"
tests:
  - name: "Unit test of the core behaviour"
  - name: "E2E smoke check"
---

## Context
Popiš co AI musí vědět před generováním: referenční modely, konvence projektů, existující soubory, stylové pravidla (lint) atd.

## Task
Konkrétní pasos krok po kroku co má AI vytvořit: soubory, metody, hooks, tests.

## Output (strict)
Jaký formát => název souboru, typ (TS/TSX/JSON), examples. Přidej krátké instrukce co testovat.

## Example prompt (finished)
```
You are a Senior React Native developer. Create a TypeScript React component <Name> ...
```
