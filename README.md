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
cp .env.example .env
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
src/components/ui/    shared UI primitives
src/features/         feature modules
src/lib/              clients/providers/helpers
src/stores/           Zustand stores
src/types/            shared types
supabase/migrations/  SQL migrations
```
