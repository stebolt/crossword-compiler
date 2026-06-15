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
    compiler/           Compiler components, hooks, lib
    components/         Solver components (CrosswordSolver, ClueList)
    lib/                Supabase clients (supabase-browser.ts, supabase-server.ts)
  proxy.ts              Auth protection for /compile/* routes
  public/word-lists/    Word list served to the client
shared/       TypeScript types shared across the app
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
- Grid is always 15×15, black cells use `"#"`, symmetry defaults to 180° rotational; setters can switch a puzzle to freestyle (one-way, per-puzzle) via the "Go Freestyle" button — stored as `symmetry boolean` on the puzzle row
- Compiler state (grid, clues, meta, shoehorn, symmetry) persisted to Supabase via `/api/puzzles/[id]` PATCH with 2s debounce; localStorage used as local cache
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
  symmetry     boolean not null default true,
  instructions text not null default '',
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  setter_name  text
);

alter table public.puzzles enable row level security;

create policy "owner_all" on public.puzzles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "published_read" on public.puzzles
  for select using (status = 'published');

create table public.puzzle_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  puzzle_id    uuid references public.puzzles(id) on delete cascade not null,
  user_email   text,
  status       text not null default 'in_progress',
  user_grid    jsonb,
  revealed     jsonb,
  started_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  completed_at timestamptz,
  unique (user_id, puzzle_id)
);

alter table public.puzzle_progress enable row level security;

-- solvers own their rows; puzzle owners can read progress for their puzzles
create policy "solver_own" on public.puzzle_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_read_progress" on public.puzzle_progress
  for select using (
    exists (select 1 from public.puzzles where puzzles.id = puzzle_progress.puzzle_id and puzzles.owner_id = auth.uid())
  );

-- required: raw SQL CREATE TABLE doesn't auto-grant data privileges like the dashboard does
grant select, insert, update, delete on table public.puzzle_progress to authenticated, anon, service_role;
```

Add users via Supabase dashboard → Authentication → Invite user. No public sign-up.

## Deployment

- **GitHub repo:** https://github.com/stebolt/crossword-compiler (public, `main` branch)
- **Vercel:** auto-deploys from `main` → https://crossword-compiler-solver.vercel.app/

## Current Status

Phase 6+7 complete and shipped. Compiler is merged into the solver's Next.js app on `main` and deployed to Vercel.

- Full spec: `/Users/steve/Vault/01 Atlas/Projects/Crossword Compiler/Spec.md`
- Backlog: `/Users/steve/Vault/01 Atlas/Projects/Crossword Compiler/Backlog.md`
