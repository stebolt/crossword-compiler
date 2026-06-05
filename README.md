# Crossword Compiler

A personal crossword creation and solving tool.

- **Compiler** — auth-gated editor for building cryptic crosswords (grid, clues, auto-fill suggestions, theme words)
- **Solver** — public-facing site where readers browse and solve published puzzles

Built with Next.js 16, Tailwind CSS v4, and Supabase. Deployed on Vercel.

## Setup

### 1. Clone and install

```bash
git clone git@github.com:stebolt/crossword-compiler.git
cd crossword-compiler/solver
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up Supabase

Run this SQL in your Supabase project (SQL Editor):

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

Invite users via Supabase dashboard → Authentication → Users → Invite user. There is no public sign-up.

### 4. Run locally

```bash
cd solver
npm run dev
# → http://localhost:3000
```

## Deploying to Vercel

1. Connect the GitHub repo to a Vercel project
2. Set the **Root Directory** to `solver`
3. Add the three environment variables from `.env.local` in Vercel project settings
4. Deploy — all routes work out of the box with Next.js on Vercel

## Project structure

```
solver/       Next.js app — compiler + solver (deploy this)
  src/
    app/        Pages: / (index), /solve/[id], /compile, /compile/[id]
    compiler/   Compiler components, hooks, lib
    components/ Solver components
    lib/        Supabase clients
compiler/     Original Vite app — archived reference only
shared/       TypeScript types shared across the project
word-lists/   Source word lists
```
