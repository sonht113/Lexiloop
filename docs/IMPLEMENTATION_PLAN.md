# LexiLoop Implementation Plan

## Product target

MVP vocabulary learning app with the loop:

```txt
Add word -> Review daily -> Repeat
```

Primary focus: fast capture, calm daily review, simple progress feedback.

## Locked MVP decisions

- Platform: Expo React Native + TypeScript.
- Routing: Expo Router.
- Backend: Supabase Auth/Postgres/RLS/RPC/Realtime.
- Styling: NativeWind + custom UI components.
- Server state: TanStack Query.
- Local/client state: Zustand.
- Forms: React Hook Form + Zod.
- Secure session persistence: Expo SecureStore.
- Notifications: Expo Notifications, scheduled locally.
- Review session: full-screen route, no bottom tab.
- Default deck: `Daily Life`, created during onboarding/signup bootstrap.
- Review UI labels: `Need practice` / `Remembered`.
- Review DB values: `forgot` / `remembered`.
- App language target for examples: English vocabulary.

## MVP scope

### In scope

- Username/password auth.
- Profile bootstrap.
- Default deck creation.
- Home dashboard.
- Deck CRUD.
- Word CRUD.
- Quick Add bottom sheet.
- Dictionary lookup for phonetic/audio.
- Daily review and deck review.
- Spaced repetition update via RPC.
- Review logs.
- Basic stats: due count, total words, mastered words, streak, accuracy.
- Reminder settings and local notification scheduling.
- Realtime sync while app is open.
- Loading, empty, error states for core screens.

### Out of scope for MVP

- Import CSV.
- AI suggestions.
- Quiz mode.
- Offline-first conflict resolution.
- Full app dark mode.
- Theme setting.
- Export data.
- Avatar upload/edit.

## Delivery phases

### Phase 0 — Base source setup

- Create Expo project structure.
- Add Expo Router route skeleton.
- Add NativeWind/Tailwind config.
- Add Supabase client wrapper.
- Add QueryClient provider.
- Add base UI components.
- Add env example.

### Phase 1 — Supabase foundation

- Create tables:
  - `profiles`
  - `decks`
  - `words`
  - `review_logs`
  - `reminder_settings`
- Add indexes and constraints.
- Enable RLS.
- Add policies with strict ownership checks.
- Add updated_at trigger.
- Add bootstrap RPC/trigger for profile/reminder/default deck.
- Add review RPC:
  - `answer_word_review(p_word_id uuid, p_result text)`

### Phase 2 — Auth

- Convert username to internal email.
- Sign up.
- Sign in.
- Restore session.
- Route guards.
- Sign out confirm.
- Bootstrap missing profile/reminder/default deck after login.

### Phase 3 — Decks and words

- Deck list.
- Create/edit/delete deck.
- Deck detail.
- Word list/search/filter.
- Add/edit/delete word.
- Quick Add with selected/default deck.
- Duplicate word handling.
- Dictionary lookup with debounce and stale-response guard.
- Audio fallback.

### Phase 4 — Review

- Review landing.
- Daily due query.
- Deck due query.
- Full-screen session.
- Flashcard front/back.
- Submit `forgot` / `remembered` through RPC.
- Disable double tap while submitting.
- Optimistic session queue.
- Review complete screen.
- No-due state.

### Phase 5 — Stats and profile

- Home dashboard stats.
- Profile stats.
- Reminder shortcut.
- Accuracy empty state.
- Mastered words rule: `correct_streak >= 5`.
- Streak calculated by user timezone.

### Phase 6 — Reminder

- Permission request when enabling.
- Permission denied state.
- Schedule/cancel local notification.
- Save Supabase settings.
- Reschedule on app start/login.

### Phase 7 — Realtime and polish

- Subscribe to decks/words/review_logs/reminder_settings.
- Invalidate TanStack Query caches on changes.
- Add skeletons/toasts.
- Polish animations and accessibility.

## Recommended first implementation PR

1. Scaffold app.
2. Add providers and route skeleton.
3. Add Supabase migration draft.
4. Add base UI primitives.
5. Add auth screen placeholders.
6. Add README with setup instructions.

