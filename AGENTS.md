# Pet Quiz Game — Repo Guide

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4 (`@import "tailwindcss"`, PostCSS via `@tailwindcss/postcss`)
- Supabase (auth + DB), `@supabase/supabase-js`
- Font: `Fredoka` via `next/font/google` (weights 600, 700)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint (core-web-vitals + TypeScript config)

## Conventions
- **Path alias**: `@/` → `./src/` (set in `tsconfig.json`)
- **All pages are `"use client"`** — no server components
- **CSS**: `cn()` from `@/lib/utils` for `clsx` + `tailwind-merge`
- **Supabase client**: import `{ supabase }` from `@/lib/supabase` (reads `NEXT_PUBLIC_SUPABASE_*` from `.env`)
- **Commit messages**: Bahasa Indonesia (from CLAUDE.md instruction)

## Quiz System (`src/lib/quiz.ts`)
- Passing threshold: `PASS_THRESHOLD = 0.7` — based on best-attempt ratio, not cumulative
- Core functions: `checkMateriAccess()`, `checkMateriPassedFromHistory()`, `submitQuiz()`, `calculateReward()`
- Progress upserted to `user_materi_progress` on conflict `(user_id, materi_id)`
- Lock/unlock computed client-side from `user_materi_progress` table, fallback to `user_question_history`

## Supabase
- All tables have RLS enabled — queries need auth context
- Key tables: `materi`, `quiz_questions`, `user_question_history`, `user_materi_progress`, `pets`, `items`, `inventory`
- Supabase URL/anon key in `.env` (gitignored)

## Next.js 16
- Breaking changes from earlier versions — read `node_modules/next/dist/docs/` before writing code
