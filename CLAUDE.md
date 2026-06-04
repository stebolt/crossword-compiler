# Crossword Compiler — Claude Code Guide


## Repo Layout

```
solver/       Next.js 16 — the unified app (compiler + solver), deployed to Vercel
  src/
    app/                Next.js App Router pages
      compile/          Compiler dashboard + editor (auth-gated)
      solve/[id]/       Public solver
      api/puzzles/      CRUD + publish API routes
      api/auth/         Sign-out
      login/            Login page
    compiler/           Migrated compiler components, hooks, lib
    components/         Solver components (CrosswordSolver, ClueList)
    lib/                Supabase clients (supabase-browser.ts, supabase-server.ts)
  proxy.ts              Auth protection for /compile/* routes
  public/word-lists/    Word list served to the client
compiler/     Original React + Vite app — archived, kept as reference
shared/       TypeScript types shared by both apps
word-lists/   Source word lists
```

## Running

```bash
cd solver && npm install && npm run dev
# → http://localhost:3000
```

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials before running.

## Key Conventions

- TypeScript throughout — import shared types from `../shared/types.ts` (relative) or `../../../../shared/types` from deep in `solver/src/compiler/`
- Tailwind CSS v4 — dark mode via `.dark` class on root (`@variant dark (&:where(.dark, .dark *))`)
- Grid is always 15×15, black cells use `"#"`, symmetry is 180° rotational
- Compiler state (grid, clues, meta, shoehorn) persisted to Supabase via `/api/puzzles/[id]` PATCH with 2s debounce; localStorage used as local cache
- Published crosswords read from Supabase (`status = 'published'`) — no static JSON files
- Next.js 16 conventions: `params` is a Promise (always `await params`), `cookies()` is async, proxy.ts replaces middleware.ts
- Browser Supabase client: `createSupabaseBrowserClient()` from `@/lib/supabase-browser`
- Server Supabase client: `createSupabaseServerClient()` from `@/lib/supabase-server`

## Supabase Setup

Run this SQL in the Supabase dashboard (SQL editor) before first use:

```sql
create table public.puzzles (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade not null,
  title        text not null default 'Untitled',
  author       text not null default '',
  status       text not null default 'draft',
  grid         jsonb not null default '[]',
  clues        jsonb not null default '{}',
  shoehorn     jsonb not null default '[]',
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.puzzles enable row level security;

create policy "owner_all" on public.puzzles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "published_read" on public.puzzles
  for select using (status = 'published');
```

Add users via Supabase dashboard → Authentication → Invite user. No public sign-up.

## Current Status

Phase 6+7 in progress (unified app + Supabase backend). Compiler is migrated into the solver's Next.js app on branch `phase7-unified-app`.

- Full spec: `/Users/steve/Vault/01 Atlas/Projects/Crossword Compiler/Spec.md`
- Backlog: `/Users/steve/Vault/01 Atlas/Projects/Crossword Compiler/Backlog.md`
