# LexiLoop

LexiLoop is an Expo React Native vocabulary learning app focused on a simple loop:

```txt
Add word -> Review daily -> Repeat
```

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

## Setup

```bash
npm install
npx expo install --fix
cp .env.example .env
npm run typecheck
npm run lint
npm run start
```

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
src/components/ui/    shared UI primitives
src/features/         feature modules
src/lib/              clients/providers/helpers
src/stores/           Zustand stores
src/types/            shared types
supabase/migrations/  SQL migrations
```

## Notes

Dependencies were scaffolded before package installation could run in the sandbox. After install, run Expo compatibility checks and follow `docs/VALIDATION_TODO.md`.
