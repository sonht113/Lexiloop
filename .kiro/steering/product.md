# Product

LexiLoop is an Expo React Native vocabulary learning app built around a spaced repetition loop:

```
Add words → Learn new words → Review due words → Practice weak words → Repeat
```

## Core capabilities

- Email/password auth backed by Supabase.
- Decks and word management with examples, notes, phonetics, and audio playback.
- Review Hub that recommends the next action: Daily Review (due), Learn New, Practice Weak, Practice All (no SRS impact).
- Spaced repetition scheduling via the `answer_word_review` Postgres RPC.
- Home Today Plan surfacing due, new, and weak items.
- Aggregate leaderboard by mastered words and words added.
- Daily reminders with local notifications, Android exact alarm support, and a server push path through Supabase Edge Functions + Expo push tokens.
- Profile stats, avatar upload, theme switch, and JSON data export.

## Audience and tone

End-users are language learners on Android and iOS. UI copy is short, action-oriented, and encouraging. Avoid jargon in user-facing strings.

## Non-goals

- No web-first experience. Web target exists for Expo dev convenience only.
- No multi-language UI yet. Keep code prepared for i18n but do not introduce a translation framework without a spec.
