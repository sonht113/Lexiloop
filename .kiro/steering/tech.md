# Tech Stack

## Runtime and language

- Expo SDK 54, React Native 0.81, React 19
- TypeScript with `strict: true`
- Path alias `@/*` → `src/*` (configured in `tsconfig.json`)

## Navigation and routing

- Expo Router v6 with typed routes (`experiments.typedRoutes` enabled in `app.json`)
- File-based routes live under `app/`
- Route groups: `(auth)` for unauthenticated screens, `(protected)` for authenticated screens, `(protected)/(tabs)` for the bottom tab bar

## Data and state

- Supabase (`@supabase/supabase-js`) for auth, Postgres, RLS, RPC, Realtime
- Supabase auth session is persisted to `expo-secure-store` (see `src/lib/supabase.ts`)
- TanStack Query for server state, query keys, caching, and invalidation
- Zustand for ephemeral client state (e.g. `src/stores/review-queue-store.ts`)
- Database types live in `src/types/database.ts` and are imported as `Database['public']['...']`

## Forms and validation

- React Hook Form with `@hookform/resolvers`
- Zod schemas colocated next to features (e.g. `src/features/decks/deck-schema.ts`)

## UI

- NativeWind (Tailwind) for styling. Global styles in `src/styles/global.css`, config in `tailwind.config.js`
- Theme handled by `src/lib/theme-provider.tsx` (`useAppTheme` hook). Use theme colors for dynamic values that NativeWind cannot express; use `className` for static styles.
- Shared primitives in `src/components/ui/` (Button, Card, AppText, Screen, FormInput, etc.). Re-export from `src/components/ui/index.ts`.
- Icons from `lucide-react-native` and `@expo/vector-icons`
- Bottom sheets via `@gorhom/bottom-sheet`, gestures via `react-native-gesture-handler`, animations via `react-native-reanimated`

## Platform features

- Local notifications and reminders via `expo-notifications`
- Android exact-alarm capability checks via the local native module `modules/lexiloop-exact-alarm`
- Audio via `expo-audio`, image picking via `expo-image-picker`, sharing via `expo-sharing`
- OTA updates via `expo-updates` (EAS Update)

## Backend

- SQL migrations under `supabase/migrations/`
- Edge Functions under `supabase/functions/` (e.g. `send-reminders`)
- `supabase/functions/**/*.ts` is excluded from the app `tsconfig.json`
- Server reminders require `REMINDER_CRON_SECRET`, `EXPO_PUBLIC_SUPABASE_URL`, and `SUPABASE_LEGACY_ANON_KEY` in Supabase Vault, plus `select private.schedule_reminder_push_cron();`

## Environment

Required variables (see `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
REMINDER_CRON_SECRET=
SUPABASE_LEGACY_ANON_KEY=
```

`EXPO_PUBLIC_*` values ship to the client. Anything sensitive must stay in Supabase Vault.

## Common commands

Use `npm` (lockfile is `package-lock.json`).

```
npm install            # install deps
npm run start          # Expo dev server
npm run android        # run on Android
npm run ios            # run on iOS
npm run web            # run on web (dev only)
npm run lint           # eslint via expo-lint
npm run typecheck      # tsc --noEmit
npm run doctor         # expo-doctor health check
npm run expo:check     # verify Expo-compatible dep versions
npm run expo:fix       # auto-fix Expo-compatible dep versions
```

Build and release:

```
npx eas-cli build --profile apk --platform android --clear-cache
eas update --branch preview --platform android --message "..."
```

Notes:

- Do not start long-running dev servers or watchers from automation; ask the user to run them.
- After dependency changes, run `npm run expo:check` (or `expo:fix`) and `npm run typecheck`.
- Android reminder accuracy needs a preview/custom build, not Expo Go.

## Conventions

- Prefer named exports.
- Hooks named `useXxxQuery` / `useXxxMutation` and colocated in `src/features/<feature>/<feature>-hooks.ts`.
- Always check `error` from Supabase calls and `throw` it so TanStack Query can surface it.
- Invalidate related query keys in `onSuccess` of mutations.
- Use the `@/` alias for imports from `src/`. Avoid deep relative paths like `../../../`.
- Never commit `.env` or anything under `systems/` (intentionally ignored).
