# Task: Achievement System & Scenario Management — Main Agent

## Task ID: achievement-scenario-main

## Summary

Implemented the Achievement System API and updated both the Dashboard and Learn pages for the Convolo language learning SaaS app.

## Work Completed

### 1. Achievement API — `/src/app/api/achievements/route.ts`

- Created GET endpoint that authenticates user via Supabase session
- Fetches user stats from DB (conversations count, words learned, day streak, best score, XP points)
- Calculates which of 10 achievements are unlocked based on stats
- Persists newly unlocked achievements to the `achievements` table
- Returns full list with unlocked status + raw stats
- Achievement definitions: first_chat, chatterbox, polyglot, word_collector, vocabulary_master, streak_3, streak_7, streak_30, perfectionist, xp_1000

### 2. Dashboard Page — `/src/app/(app)/dashboard/page.tsx`

- Added `Achievement` interface and `achievements` state
- Fetches from `/api/achievements` alongside existing profile/conversations/stats calls
- Replaced the "No achievements yet" placeholder with:
  - Grid of achievement cards (2/3/5 columns responsive)
  - Unlocked achievements: gold border, gradient background, emoji icon, title, description
  - Locked achievements: greyed out (opacity-60), lock icon, muted text
  - Empty state preserved when no achievements data available
- Added `Lock` icon import from lucide-react

### 3. Learn Page — `/src/app/(app)/learn/page.tsx`

- Replaced hardcoded scenarios with API fetch from `/api/scenarios`
- Added `Scenario` interface matching API response shape
- Kept `FALLBACK_SCENARIOS` for when API fails or returns empty
- Added category filter tabs: All, Daily, Travel, Social, Business, Medical
- `useMemo` for filtered scenarios based on active category
- Added loading skeleton state while scenarios fetch
- Added empty state when category filter yields no results
- Added scenario count display
- Added `Crown` icon for premium badge
- Passes `scenarioId` to conversation start

## Files Modified

- NEW: `/src/app/api/achievements/route.ts`
- MODIFIED: `/src/app/(app)/dashboard/page.tsx`
- MODIFIED: `/src/app/(app)/learn/page.tsx`

## Lint & Type Check Results

- ESLint: 0 errors (1 pre-existing warning in vocabulary/review)
- TypeScript: No errors in our files (pre-existing errors in Stripe routes and db types)
