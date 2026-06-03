# Crossword Compiler — Claude Code Guide


## Repo Layout

```
compiler/     React + Vite — the local crossword building tool
solver/       Next.js — the public solving site (Vercel)
shared/       TypeScript types shared by both apps
word-lists/   Flat-file word lists (gitignored if large)
```

## Running the Apps

```bash
# Compiler (local dev)
cd compiler && npm install && npm run dev
# → http://localhost:5173

# Solver (local dev)
cd solver && npm install && npm run dev
# → http://localhost:3000
```

## Key Conventions

- TypeScript throughout — import shared types from `../shared/types.ts`
- Tailwind CSS for styling in both apps
- Crossword data format defined in `shared/types.ts` — do not duplicate or diverge
- Grid is always 15×15, black cells use `"#"`, symmetry is 180° rotational
- Compiler stores work-in-progress in `localStorage`
- Solver reads published crosswords from `solver/public/crosswords/` (MVP) — one JSON file per crossword plus a `crosswords.json` manifest

## Current Status

Phases 1–5 complete. See the backlog for what to work on next.

- Full spec: `/Users/steve/Vault/01 Atlas/Projects/Crossword Compiler/Spec.md`
- Backlog: `/Users/steve/Vault/01 Atlas/Projects/Crossword Compiler/Backlog.md`
