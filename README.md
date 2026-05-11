# LexiLoop

LexiLoop is an Expo React Native vocabulary learning app built around a spaced repetition loop:

```txt
Add words -> Learn new words -> Review due words -> Practice weak words -> Repeat
```

## Features

- Email/password auth with Supabase.
- Decks and word management with examples, notes, phonetics, and audio playback.
- Review Hub with recommended next action:
  - Daily Review for due words.
  - Learn New for fresh words.
  - Practice Weak for missed words.
  - Practice All without changing SRS due dates.
- Spaced repetition scheduling through `answer_word_review`.
- Home Today Plan with due, new, and weak learning tasks.
- Deck detail stats, filtering, practice actions, and next review metadata on word cards.
- Aggregate leaderboard by mastered words and words added.
- Daily reminder settings with local notifications and Android exact alarm support.
- Profile stats, avatar upload, theme switch, and JSON data export.

## Stack

- Expo React Native
- TypeScript
- Expo Router
- Supabase Auth/Postgres/RLS/RPC/Realtime
- NativeWind
- TanStack Query
- Zustand
- React Hook Form + Zod
- Expo SecureStore
- Expo Notifications
- Expo local module for Android exact alarm access checks

## Setup

```bash
npm install
npx expo install --fix
cp .env.example .env
npm run typecheck
npm run lint
npm run start
```

## Build And Preview

Preview APK build:

```bash
npx eas-cli build --profile apk --platform android --clear-cache
```

Preview OTA update:

```bash
eas update --branch preview --platform android --message "Update preview"
```

Notes:

- Android reminder accuracy requires a preview/custom build, not Expo Go.
- Users must allow notification permission and Android "Alarms & reminders" permission for exact reminder timing.
- iOS builds require an Apple Developer Program account when distributing through App Store/TestFlight.

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
npm run doctor
npm run expo:check
npm run expo:fix
```

## Environment

See `.env.example`.

Required:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Source layout

```txt
app/                  Expo Router routes
assets/               app icons/splash placeholders
modules/              local Expo native modules
src/components/ui/    shared UI primitives
src/features/         feature modules
src/lib/              clients/providers/helpers
src/stores/           Zustand stores
src/styles/           global NativeWind styles
src/types/            shared types
supabase/migrations/  SQL migrations
```

## Notes

- Keep Supabase schema changes in migrations and verify remote changes before release.
- Do not commit `systems/`; it is intentionally ignored for local planning/system docs.
- After dependency changes, run Expo compatibility checks and follow `docs/VALIDATION_TODO.md`.
