# Onboarding Flow - Work Record

## Task: Build 3-Step Onboarding Wizard for Convolo

### Files Created:

1. **`/src/app/(app)/onboarding/page.tsx`** — Full 3-step onboarding wizard
   - Step 1: Native Language selection (grid with flag emojis)
   - Step 2: Target Language selection (filtered to exclude native)
   - Step 3: Proficiency Level (Beginner/Intermediate/Advanced cards)
   - Animated step transitions (slide left/right)
   - Step indicator with progress dots and checkmarks
   - Continue button enabled only when selection made
   - Back button on steps 2-3
   - Full-screen layout with gradient background
   - Mobile-responsive design
   - Saves to profile via PUT /api/user/profile
   - Redirects to /dashboard on completion

### Files Modified:

2. **`/src/lib/constants.ts`** — Expanded SUPPORTED_LANGUAGES from 4 to 13 languages
3. **`/src/stores/profile-store.ts`** — Added `onboardingCompleted: boolean` to ProfileData interface
4. **`/src/app/api/user/profile/route.ts`** — Added `onboardingCompleted` computed field to GET and PUT responses (derived from `targetLanguage !== null`)
5. **`/src/app/(app)/layout.tsx`** — Added onboarding redirect logic and full-screen rendering for onboarding page (no sidebar/nav)

### Design Decisions:

- `onboardingCompleted` is derived from `targetLanguage !== null` — avoids needing a database schema migration
- Onboarding page renders without sidebar/mobile nav by checking pathname in layout
- Profile is auto-fetched in layout on mount when user is authenticated but profile not yet loaded
- Step transitions use CSS translate + opacity animations for smooth feel
- All colors use CSS custom properties for theme consistency
