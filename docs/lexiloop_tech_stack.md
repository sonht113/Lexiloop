# LexiLoop - Tech Stack

## 1. Overview

LexiLoop là app mobile học từ vựng tiếng Anh bằng flashcards.

Stack được chọn theo tiêu chí:

- Build MVP nhanh
- Hợp với Expo React Native
- UI custom tốt
- Auth đơn giản
- Supabase database + realtime
- Reminder bằng local notification
- Dễ mở rộng AI sau này

Final recommended stack:

```txt
Expo React Native
TypeScript
Supabase
NativeWind
gluestack-ui
Zustand
React Navigation
Expo Notifications
React Hook Form + Zod
```

---

## 2. Frontend Framework

## 2.1 Expo React Native

Use:

```txt
Expo
React Native
```

Lý do:

- Setup nhanh
- Dễ chạy iOS/Android
- Hỗ trợ notification tốt
- Hợp MVP cá nhân
- Dễ tích hợp Supabase
- Không cần native setup phức tạp ban đầu

---

## 2.2 TypeScript

Use:

```txt
TypeScript
```

Lý do:

- Giảm bug
- Type rõ cho database model
- Dễ refactor
- Hợp với Supabase generated types

---

## 3. Backend / BaaS

## 3.1 Supabase

Use:

```txt
Supabase
```

Supabase features sử dụng:

- Auth
- PostgreSQL
- Row Level Security
- Realtime
- Edge Functions optional later

---

## 3.2 Supabase Auth

Auth UX:

```txt
username + password
```

Implementation:

```txt
username → username@lexiloop.local
```

Supabase Auth method:

```txt
email/password
```

Lý do:

- Supabase Auth hỗ trợ email/password ổn định
- User vẫn chỉ cần nhập username/password
- Không tự xử lý password
- An toàn hơn custom auth

---

## 3.3 Supabase PostgreSQL

Dùng để lưu:

- profiles
- decks
- words
- review_logs
- reminder_settings

---

## 3.4 Supabase Realtime

Dùng để sync khi app đang mở.

Subscribed tables:

- decks
- words
- review_logs
- reminder_settings

Important:

```txt
Supabase Realtime không dùng để bắn reminder khi app tắt.
```

---

## 4. Notification

## 4.1 Expo Notifications

Use:

```txt
expo-notifications
```

Dùng cho:

- Daily reminder
- Local notification
- User chọn giờ học mỗi ngày

Flow:

```txt
User chọn reminder time
  ↓
Save setting vào Supabase
  ↓
Schedule local notification bằng Expo Notifications
```

---

## 5. UI Styling

## 5.1 NativeWind

Use:

```txt
NativeWind
```

Lý do:

- Tailwind-like styling trong React Native
- Dễ map từ design system
- Tạo custom UI nhanh
- Hợp card-based soft UI

Packages:

```bash
nativewind
tailwindcss
```

---

## 5.2 UI Component Base

Recommended:

```txt
gluestack-ui
```

Alternative:

```txt
React Native Reusables
```

Lý do:

- Component base tốt
- Dễ custom
- Không bị quá Material Design
- Hợp app có design riêng

Components cần:

- Button
- Input
- Card
- Switch
- Modal
- Toast
- Select
- Badge
- Form control

---

## 5.3 Icons

Use:

```txt
lucide-react-native
```

Lý do:

- Icon minimal
- Hợp UI hiện đại
- Dễ custom size/stroke
- Nhiều icon đủ dùng

---

## 6. Navigation

Use:

```txt
React Navigation
```

Packages:

```bash
@react-navigation/native
@react-navigation/native-stack
@react-navigation/bottom-tabs
```

Navigation structure:

```txt
RootNavigator
  ├── AuthStack
  │     ├── Onboarding
  │     ├── SignIn
  │     └── SignUp
  │
  └── MainStack
        ├── MainTabs
        │     ├── Home
        │     ├── Review
        │     ├── Decks
        │     └── Profile
        │
        ├── AddWord
        ├── EditWord
        ├── DeckDetail
        ├── AddDeck
        ├── ReminderSettings
        └── ReviewComplete
```

---

## 7. State Management

Use:

```txt
Zustand
```

Lý do:

- Nhẹ
- Dễ hiểu
- Ít boilerplate
- Hợp app MVP
- Dễ chia store theo domain

Stores đề xuất:

```txt
authStore
profileStore
deckStore
wordStore
reviewStore
reminderStore
uiStore
```

---

## 7.1 authStore

State:

```txt
session
user
isLoading
```

Actions:

```txt
signUp(username, password)
signIn(username, password)
signOut()
restoreSession()
```

---

## 7.2 deckStore

State:

```txt
decks
isLoading
```

Actions:

```txt
fetchDecks()
createDeck()
updateDeck()
deleteDeck()
```

---

## 7.3 wordStore

State:

```txt
words
dueWords
isLoading
```

Actions:

```txt
fetchWords()
fetchDueWords()
createWord()
updateWord()
deleteWord()
fetchPronunciation()
```

---

## 7.4 reviewStore

State:

```txt
queue
currentIndex
sessionStats
```

Actions:

```txt
startDailyReview()
startDeckReview(deckId)
answerForgot(word)
answerRemembered(word)
completeReview()
resetReview()
```

---

## 7.5 reminderStore

State:

```txt
reminderSettings
```

Actions:

```txt
fetchReminderSettings()
updateReminderSettings()
scheduleLocalNotification()
cancelNotification()
```

---

## 8. Forms & Validation

## 8.1 React Hook Form

Use:

```txt
react-hook-form
```

Dùng cho:

- Sign In
- Sign Up
- Add Word
- Edit Word
- Add Deck
- Reminder Settings

---

## 8.2 Zod

Use:

```txt
zod
```

Dùng để validate:

- username
- password
- word
- meaning
- deck name
- reminder time

Example validation rules:

```txt
username min 3
password min 6
word required
meaning required
deck_id required
```

---

## 9. Date & Time

Use:

```txt
dayjs
```

Dùng cho:

- due today
- next_review_at
- review history
- streak
- reminder time
- timezone formatting

Package:

```bash
dayjs
```

---

## 10. Dictionary / Pronunciation

## 10.1 Dictionary API

MVP có thể dùng:

```txt
Free Dictionary API
```

Endpoint pattern:

```txt
GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
```

Dữ liệu cần lấy:

```txt
phonetic
audio_url
```

Important:

```txt
Nếu API fail, app vẫn cho save word.
```

---

## 10.2 Future Alternative

Phase sau có thể dùng AI để generate:

- meaning
- example
- example translation
- word explanation

Nhưng MVP chỉ nên dùng dictionary API để lấy phonetic/audio.

---

## 11. Audio Playback

Use Expo package:

```txt
expo-audio
```

Hoặc tùy version Expo có thể dùng audio API phù hợp.

Dùng cho:

- Play pronunciation audio
- Speaker button trong Add Word
- Speaker button trong Review

---

## 12. Animation & Gesture

## 12.1 Reanimated

Use:

```txt
react-native-reanimated
```

Dùng cho:

- Flashcard flip
- Progress animation
- Button press feedback
- Completion animation

---

## 12.2 Gesture Handler

Use:

```txt
react-native-gesture-handler
```

Dùng cho:

- Flashcard interaction
- Bottom sheet
- Swipe later if needed

---

## 13. Bottom Sheet

Use:

```txt
@gorhom/bottom-sheet
```

Dùng cho:

- Quick Add
- Word options
- Add deck
- Filter panel

Quick Add nên là bottom sheet để thêm từ nhanh mà không phá context.

---

## 14. Toast

Recommended:

```txt
sonner-native
```

Dùng cho:

- Word saved
- Deck created
- Reminder updated
- Pronunciation fetch failed
- Error messages

---

## 15. Local Secure Storage

Use:

```txt
expo-secure-store
```

Dùng cho:

- Supabase session storage nếu cần custom storage
- Secure auth persistence

---

## 16. Environment Variables

Required:

```txt
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Never expose:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

Service role key không được để trong mobile app.

---

## 17. Suggested Packages

```bash
# Core
expo
react-native
typescript

# Supabase
@supabase/supabase-js

# Navigation
@react-navigation/native
@react-navigation/native-stack
@react-navigation/bottom-tabs

# Styling / UI
nativewind
tailwindcss
gluestack-ui
lucide-react-native

# State
zustand

# Forms
react-hook-form
zod
@hookform/resolvers

# Notification
expo-notifications

# Storage
expo-secure-store

# Date
dayjs

# Animation / Gesture
react-native-reanimated
react-native-gesture-handler

# Bottom Sheet
@gorhom/bottom-sheet

# Toast
sonner-native
```

---

## 18. Suggested Folder Structure

```txt
src/
  app/
    navigation/
      RootNavigator.tsx
      AuthNavigator.tsx
      MainTabs.tsx
      MainStack.tsx

  screens/
    onboarding/
      OnboardingScreen.tsx

    auth/
      SignInScreen.tsx
      SignUpScreen.tsx

    home/
      HomeScreen.tsx

    review/
      ReviewScreen.tsx
      ReviewCompleteScreen.tsx

    decks/
      DecksScreen.tsx
      DeckDetailScreen.tsx
      AddDeckScreen.tsx

    words/
      AddWordScreen.tsx
      EditWordScreen.tsx

    reminders/
      ReminderSettingsScreen.tsx

    profile/
      ProfileScreen.tsx

  components/
    ui/
      Button.tsx
      Input.tsx
      Card.tsx
      Badge.tsx
      ProgressBar.tsx
      Screen.tsx
      EmptyState.tsx
      Toast.tsx

    flashcards/
      Flashcard.tsx
      FlashcardFront.tsx
      FlashcardBack.tsx

    words/
      WordCard.tsx
      QuickAddSheet.tsx
      PronunciationBox.tsx

    decks/
      DeckCard.tsx

    reminders/
      ReminderCard.tsx

  stores/
    authStore.ts
    profileStore.ts
    deckStore.ts
    wordStore.ts
    reviewStore.ts
    reminderStore.ts
    uiStore.ts

  services/
    supabase.ts
    authService.ts
    profileService.ts
    deckService.ts
    wordService.ts
    reviewService.ts
    reminderService.ts
    notificationService.ts
    dictionaryService.ts
    audioService.ts
    realtimeService.ts

  lib/
    username.ts
    date.ts
    spacedRepetition.ts
    validation.ts
    constants.ts

  types/
    database.ts
    models.ts
    navigation.ts
```

---

## 19. Development Phases

## Phase 1 - MVP Core

- Expo setup
- Supabase setup
- Username/password auth
- Profiles
- Deck CRUD
- Word CRUD
- Quick Add
- Dictionary phonetic/audio fetch
- Daily review
- Spaced repetition
- Review logs

## Phase 2 - Habit Layer

- Reminder settings
- Expo Notifications
- Streak
- Basic stats
- Search/filter

## Phase 3 - Sync & Polish

- Supabase Realtime
- Better animations
- Better empty/error states
- Better loading skeletons

## Phase 4 - Advanced

- Import CSV
- AI suggestions
- Quiz mode
- Dark mode
- Offline-first sync

---

## 20. Final Stack Decision

Use this stack for MVP:

```txt
Expo React Native + TypeScript
Supabase Auth/Postgres/Realtime
NativeWind + gluestack-ui
Zustand
React Navigation
React Hook Form + Zod
Expo Notifications
Free Dictionary API
```

This stack is simple, practical, and strong enough for the full LexiLoop MVP.
