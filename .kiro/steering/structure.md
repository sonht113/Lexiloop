# Project Structure

## Top-level layout

```
app/                  Expo Router routes (file-based)
assets/               app icons, splash, onboarding images
modules/              local Expo native modules (e.g. lexiloop-exact-alarm)
src/                  application source
supabase/             SQL migrations and Edge Functions
docs/                 internal docs and validation notes
systems/              local planning notes (gitignored, do not commit)
```

Root config:

```
app.json              Expo config (plugins, permissions, EAS, scheme)
eas.json              EAS build/update profiles
tsconfig.json         strict TS, @/* alias to src/*
tailwind.config.js    NativeWind theme tokens
babel.config.js       NativeWind + reanimated plugins
metro.config.js       Metro bundler config
eslint.config.js      flat config extending eslint-config-expo
```

## `app/` — Expo Router

```
app/
  _layout.tsx                  root layout, providers, splash
  index.tsx                    entry / redirect
  onboarding.tsx               first-run onboarding
  (auth)/
    _layout.tsx                stack for unauthenticated screens
    sign-in.tsx
    sign-up.tsx
  (protected)/
    _layout.tsx                gate that requires a Supabase session
    (tabs)/
      _layout.tsx              bottom tab bar
      home.tsx, decks.tsx, review.tsx, profile.tsx
    deck/[id]/index.tsx        deck detail
    word/[id]/edit.tsx         edit a word
    word/quick-add.tsx         quick add modal
    review/session.tsx         active review session
    reminder/index.tsx
    learning-goals.tsx
    leaderboard.tsx
```

Rules:

- Route files only handle navigation, params, and composition. Push business logic into hooks/services in `src/features/`.
- Use route groups (`(auth)`, `(protected)`) instead of conditional renders to gate sessions.
- Dynamic params use `[id]` folders.

## `src/` — application code

```
src/
  components/ui/      shared, app-agnostic primitives (Button, Card, Screen, AppText, FormInput, AppHeader, EmptyState, FieldError, AppAlert)
  features/           feature modules, one folder per domain
  lib/                cross-cutting clients and providers (supabase, theme-provider, query-provider, realtime-provider, onboarding-storage)
  stores/             Zustand stores (e.g. review-queue-store)
  styles/             global NativeWind/Tailwind styles
  types/              shared TS types (e.g. database.ts generated from Supabase)
```

### Feature module pattern

Each `src/features/<feature>/` folder contains the pieces for one domain. Existing features:

```
auth, decks, home, leaderboard, learning-settings, profile, reminder, review, words
```

Conventions inside a feature:

- `<feature>-hooks.ts` — TanStack Query hooks (`useXxxQuery`, `useXxxMutation`) and any feature-specific React hooks.
- `<feature>-schema.ts` — Zod schemas and inferred types for forms.
- `<feature>-form.tsx`, `<feature>-card.tsx`, `<feature>-selector.tsx` — feature-scoped components.
- Service files like `notification-service.ts`, `dictionary-api.ts`, `push-token-service.ts` for non-React logic.
- Utilities like `auth-utils.ts`, `user-bootstrap.ts` when state/logic does not fit a hook.

Cross-feature sharing rule: if a component or helper is used by more than one feature, lift it into `src/components/ui/` or `src/lib/` rather than importing across `src/features/*`.

### `src/lib/` — providers and clients

- `supabase.ts` — single Supabase client instance with SecureStore session storage.
- `query-provider.tsx`, `realtime-provider.tsx`, `theme-provider.tsx` — mounted in `app/_layout.tsx`.
- `onboarding-storage.ts` — first-run flag persistence.

Add new providers here and mount them in the root layout.

## `supabase/`

```
supabase/
  migrations/         SQL migrations (source of truth for schema)
  functions/          Edge Functions (e.g. send-reminders)
```

- All schema changes go through migrations. Do not edit production schema directly.
- Edge Function code is excluded from the app `tsconfig.json`; treat it as a separate Deno project.

## `modules/`

Local Expo modules. `lexiloop-exact-alarm` exposes Android exact-alarm permission checks. Add new native modules here only when an Expo package does not exist.

## Naming

- Files: `kebab-case.tsx` / `kebab-case.ts`.
- React components: `PascalCase` exports.
- Hooks: `useCamelCase`.
- Zustand stores: `useXxxStore`.
- Query keys: stable arrays starting with the domain, e.g. `['decks']`, `['decks', deckId]`, `['words', deckId]`.

## Imports

- Use the `@/` alias for anything in `src/` (e.g. `import { supabase } from '@/lib/supabase'`).
- Relative imports are fine within the same folder (`./button`).
- Never import from `app/` into `src/`. Routes depend on `src/`, not the other way around.
