# Parallel You

Parallel You is a Next.js MVP that generates five alternate versions of a user's life from a short onboarding quiz. Generation is deterministic and template-based for now, so the app is easy to run, edit, and expand solo.

## Stack

- Next.js App Router, pinned to the stable Next 14 line for broad hosted editor compatibility
- React + TypeScript
- Tailwind CSS
- Supabase-ready data model

## Getting Started

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

The MVP works anonymously without Supabase. Saved timelines fall back to `localStorage` when Supabase env vars are missing.

To enable Supabase:

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/20260505143000_parallel_you_mvp.sql`.
3. Add these variables to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Tables included:

- `profiles`
- `life_sessions`
- `parallel_versions`
- `saved_timelines`

## Editing Generation Logic

All life generation logic lives in `lib/life-generator.ts`.

Edit that file to change archetypes, story templates, scoring, traits, career directions, timelines, and merge behavior.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```
