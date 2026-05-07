# LexiLoop Validation TODO

This project was scaffolded before dependencies could be installed in the sandbox. Run this checklist once package installation is available.

## 1. Install

```bash
cd lexiloop-app
npm install
```

## 2. Static validation

```bash
npm run typecheck
npm run lint
```

Expected likely fixes after typecheck:

- Expo Router typed hrefs for grouped routes.
- TanStack Query version mismatch:
  - v5 uses `isPending`
  - v4 uses `isLoading` for mutations
- NativeWind support for `className` and `contentContainerClassName`.
- Supabase `SupportedStorage` type for SecureStore adapter.
- Expo Notifications trigger type.
- Supabase relation typing for joined queries.

## 3. Runtime validation

```bash
npm run start
```

Check screens:

- Sign Up
- Sign In
- Home
- Decks
- Deck Detail
- Quick Add
- Edit Word
- Review Landing
- Review Session
- Reminder Settings
- Profile

## 4. Supabase validation

Apply migrations in order:

```txt
supabase/migrations/0001_mvp_schema.sql
supabase/migrations/0002_bootstrap_and_triggers.sql
supabase/migrations/0003_stats_and_streak.sql
```

Then verify:

- New user signup creates:
  - `profiles`
  - `reminder_settings`
  - default deck `Daily Life`
- RLS blocks cross-user access.
- Creating word validates owned deck.
- `answer_word_review` updates word and inserts review log.
- Stats RPC returns expected values.

## 5. Manual smoke test

1. Sign up with username/password.
2. Confirm default deck exists.
3. Add word through Quick Add.
4. Confirm word appears in Deck Detail.
5. Start Review.
6. Reveal card.
7. Tap `Remembered`.
8. Confirm card disappears from due queue.
9. Check Home/Profile stats update.
10. Configure reminder at `20:00`.
11. Sign out and sign back in.

