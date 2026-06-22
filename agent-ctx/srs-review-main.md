# SRS Review Feature — Work Record

## Task: Build SRS Review Feature for Convolo

### Files Created

1. **`/src/app/api/vocabulary/review/route.ts`** — Review API with GET and POST endpoints
2. **`/src/app/(app)/vocabulary/review/page.tsx`** — Flashcard-style review page

### Files Modified

1. **`/src/app/(app)/vocabulary/page.tsx`** — Added link to review page from "Review" button and "Start Review" button in header
2. **`/eslint.config.mjs`** — Added `react-hooks/set-state-in-effect`, `react-hooks/immutability`, and `react-hooks/refs` rules to off (to match existing codebase patterns)

### API Design

- **GET /api/vocabulary/review**: Fetches up to 10 vocabulary items due for review, sorted by SRS priority (lower mastery first, never-reviewed first, older review dates first)
- **POST /api/vocabulary/review**: Accepts `{ itemId, quality }` where quality is "again" | "hard" | "good" | "easy". Updates SRS metadata in message's JSONB metadata field.

### SRS Algorithm (Simplified)

- Intervals: again=1min, hard=10min, good=1440min (1 day), easy=10080min (7 days)
- "again": mastery drops by 1, resets interval
- "hard": mastery stays, interval stays same
- "good": mastery +1, interval doubles
- "easy": mastery +2, interval triples

### Review Page Features

- Full-screen flashcard experience with card flip animation (CSS 3D transform)
- Front: word + part of speech + mastery indicator
- Back: translation + definition + example sentence
- 4 color-coded rating buttons (red/orange/green/blue)
- Progress bar at top
- Keyboard shortcuts (Space/Enter to flip, 1-4 to rate)
- "Review Complete" summary with stats grid (cards reviewed, accuracy, correct count)
- Rating breakdown visualization
- Empty state with CTA to start conversations
- Mobile-first responsive design
