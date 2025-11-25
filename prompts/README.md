# Prompty — jak je strukturovat a používat

Tato složka obsahuje šablony a připravené prompt‑soubory, které budeme používat při generování kódu a návrhu klientské aplikace pomocí Copilotu / AI.

Principy:
- Ukládej každý prompt jako Markdown; přidej nahoře YAML frontmatter se základními metadaty (title, intent, persona, version, tags).
- Každý prompt bude mít 3 části: Context (co má AI vědět), Task (co přesně generovat), Output (formát, akceptační kritéria, testy/požadavky).
- Piš prompty co nejkonkrétněji. Pokud chceš více iterací, vytvoř samostatné verze: v souboru naznač verzování (v1, v2...).

Formát souborů v této složce:
- master-prompt.md — celkové pravidla a „projektový manifest" (dělící pravidla a povinné konvence).
- task-model.md — prompt pro návrh datového modelu Task (schema, příklady JSON, migrace, constraints).
- task-gui.md — prompt pro vygenerování vizuální reprezentace úkolu (TaskCard, listy, accessibility, snapshots).
- client-ui.md — layout celé aplikace, menu, navigace, theme, responsive rules.
- users-usecases.md — scénáře / user stories: jak budou uživatelé pracovat s úkoly a sdílením.
- share-security.md — prompt se zásadami sdílení, autorizace, jednoduché omezení prav: roles / capabilities.
- prompt-template.md — řádně vyplnitelná šablona (YAML+Markdown) kterou vždy použijeme.

Jak pracovat:
1. Nejprve aktualizuj `master-prompt.md` se zásadami projektu.
2. Pro nový kus práce (např. Task model) vytvoř nový branch + použij prompt soubor jako „single source of truth".
3. AI nech generovat malé kroky — 1 komponenta / 1 hook / 1 test na PR.

Poznámka: soubory jsou v češtině — prompt psaný v češtině je v pořádku, ale pro lepší kompatibilitu s Copilotem napiš rozumný anglický převod, pokud bude nutné generovat velké množství kódu.
