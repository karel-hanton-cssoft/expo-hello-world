---
title: "Share and security prompt"
intent: "Definovat jednoduchý model sdílení a autorizace pro domácí task app (role-based minimal)"
persona: "Security-minded backend dev — keep it simple & auditable"
version: "1.0"
tags: ["security","sharing","auth"]
---

Context
- Lightweight app: groups can contain members; tasks can be assigned or shared with members or groups. No enterprise SSO needed now.

Task
1. Propose a minimal authorization model: roles (owner, member), capabilities (create, update, assign, delete), and simple checks.
2. Describe sharing API vocabulary (POST /groups/:id/members, POST /tasks/:id/share {to: userId|groupId}).
3. Add security notes: server-side checks, trust boundaries, and simple audit fields on Task (createdBy, updatedBy, sharedWith).

Output
- A short spec (3–8 bullets) plus JSON examples for share payload and a minimal RBAC table.

Acceptance criteria
- Secure‑by‑default suggestions, and no complex crypto/SSO required for MVP.
