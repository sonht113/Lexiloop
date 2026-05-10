# LexiLoop - Flow System

## 1. Core Product Flow

LexiLoop tập trung vào một vòng lặp học đơn giản:

```txt
Gặp từ mới
  ↓
Add word nhanh
  ↓
App tự lấy phonetic/audio
  ↓
Review hằng ngày
  ↓
User chọn Forgot / Remembered
  ↓
Spaced repetition cập nhật lịch ôn
  ↓
Reminder giúp duy trì thói quen
```

Core loop:

```txt
Add → Review → Repeat
```

---

## 2. App Launch Flow

```txt
User mở app
  ↓
App kiểm tra Supabase session
  ↓
Nếu chưa đăng nhập
  └── Auth Stack
        ├── Onboarding
        ├── Sign In
        └── Sign Up

Nếu đã đăng nhập
  └── Main App
        ├── Fetch profile
        ├── Fetch decks
        ├── Fetch due words
        ├── Fetch reminder settings
        └── Home
```

---

## 3. Authentication Flow

App sử dụng đăng ký / đăng nhập đơn giản bằng:

```txt
username + password
```

Supabase Auth mặc định dùng email/password, nên app sẽ convert username thành email nội bộ.

Example:

```txt
username: sondev
internal email: sondev@lexiloop.local
```

User không cần thấy email này.

---

## 3.1 Sign Up Flow

```txt
User mở Sign Up
  ↓
Nhập username
  ↓
Nhập password
  ↓
Nhập confirm password
  ↓
Validate form
  ↓
Convert username → username@lexiloop.local
  ↓
Call Supabase Auth signUp
  ↓
Nếu thành công:
      tạo row trong profiles
      tạo reminder_settings mặc định
      redirect Home
  ↓
Nếu lỗi:
      hiển thị error message
```

Validation:

```txt
username required
username min length = 3
password min length = 6
confirm password must match
```

Default reminder settings:

```txt
enabled = false
reminder_time = 20:00
timezone = Asia/Ho_Chi_Minh
repeat_days = every day
```

---

## 3.2 Sign In Flow

```txt
User mở Sign In
  ↓
Nhập username + password
  ↓
Validate form
  ↓
Convert username → username@lexiloop.local
  ↓
Call Supabase Auth signInWithPassword
  ↓
Nếu thành công:
      store session
      fetch profile
      redirect Home
  ↓
Nếu lỗi:
      show "Invalid username or password"
```

---

## 3.3 Sign Out Flow

```txt
User vào Profile
  ↓
Tap Sign Out
  ↓
Confirm
  ↓
Call Supabase signOut
  ↓
Clear Zustand stores
  ↓
Clear local review queue
  ↓
Navigate to Sign In
```

---

## 4. Home Flow

## 4.1 Home Load

```txt
Home screen mount
  ↓
Fetch:
  - profile
  - due words count
  - total words
  - mastered words
  - streak
  - recent decks
  - reminder settings
  ↓
Display dashboard
```

Due words condition:

```txt
next_review_at <= now()
```

Mastered condition:

```txt
correct_streak >= 5
```

---

## 4.2 Home Actions

```txt
Home
  ├── Start Review
  │     └── Review Flow
  │
  ├── Quick Add
  │     └── Quick Add Flow
  │
  ├── Add Word
  │     └── Full Add Word Flow
  │
  ├── Deck Card
  │     └── Deck Detail
  │
  └── Reminder Card
        └── Reminder Settings
```

---

## 4.3 Home Empty States

If user has no words:

```txt
No words yet.
Add your first word and start learning today.
```

If user has words but no due words:

```txt
You’re all caught up.
Great job. Come back tomorrow.
```

---

## 5. Quick Add Flow

Quick Add là flow quan trọng nhất để user thêm từ nhanh.

## 5.1 Entry Points

```txt
Home Quick Add
Deck Detail Quick Add
Review Complete Add New Word
```

## 5.2 Quick Add Steps

```txt
User tap Quick Add
  ↓
Open bottom sheet
  ↓
User nhập word
  ↓
App tự fetch phonetic/audio
  ↓
User nhập meaning
  ↓
User chọn deck
  ↓
Tap Save
  ↓
Validate required fields
  ↓
Insert word vào Supabase
  ↓
Set next_review_at = now()
  ↓
Update local state
  ↓
Show toast "Word saved"
```

Required fields:

```txt
word
meaning
deck_id
```

Optional auto fields:

```txt
phonetic
audio_url
```

---

## 5.3 Auto Pronunciation Fetch

```txt
User nhập word
  ↓
Debounce 500ms hoặc tap Fetch
  ↓
Call Dictionary API
  ↓
Nếu success:
      lấy phonetic text
      lấy audio URL nếu có
      fill vào form
  ↓
Nếu fail:
      show non-blocking message
      vẫn cho phép save
```

Important:

```txt
Không block user nếu không có phonetic/audio.
```

---

## 5.4 Quick Add Save

When saved:

```txt
word.review_count = 0
word.correct_streak = 0
word.level = 0
word.next_review_at = now()
word.last_reviewed_at = null
```

New word sẽ có thể xuất hiện trong review hôm nay.

---

## 6. Full Add Word Flow

Full Add Word dành cho user muốn thêm nhiều thông tin hơn.

## 6.1 Fields

Required:

```txt
word
meaning
deck
```

Optional:

```txt
phonetic
audio_url
example
example_translation
tags
notes
```

## 6.2 Flow

```txt
User tap Add Word
  ↓
Open Add Word screen
  ↓
User nhập word
  ↓
App fetch phonetic/audio
  ↓
User nhập meaning
  ↓
User chọn deck
  ↓
Optional:
      example
      example_translation
      tags
      notes
  ↓
Tap Save Word
  ↓
Insert word
  ↓
Navigate back hoặc Save & Add Another
```

---

## 7. Deck Flow

## 7.1 View Decks

```txt
User open Decks tab
  ↓
Fetch all decks by user_id
  ↓
For each deck calculate:
      total_words
      due_words
      mastered_words
      progress
  ↓
Render deck cards
```

---

## 7.2 Create Deck

```txt
Tap Add Deck
  ↓
Input deck name
  ↓
Optional:
      description
      icon
      color
  ↓
Validate
  ↓
Insert deck
  ↓
Update UI
```

Default decks may be suggested after signup:

```txt
Daily Life
Developer English
IELTS
Travel
```

But MVP can start with no decks and ask user to create one.

---

## 7.3 Deck Detail Flow

```txt
Tap deck card
  ↓
Open Deck Detail
  ↓
Fetch words in deck
  ↓
Show:
      summary
      filters
      search
      word list
```

Actions:

```txt
Start Review This Deck
Add Word
Edit Deck
Delete Deck
Edit Word
Delete Word
```

---

## 7.4 Delete Deck Flow

```txt
Tap Delete Deck
  ↓
Show confirm modal
  ↓
If confirm:
      delete deck
      cascade delete words
      cascade delete review_logs
```

MVP decision:

```txt
Delete deck = delete all words inside it.
```

---

## 8. Word Management Flow

## 8.1 Edit Word

```txt
Open word card menu
  ↓
Tap Edit
  ↓
Open Edit Word screen
  ↓
Update fields
  ↓
Save
  ↓
Update Supabase
  ↓
Update local state
```

## 8.2 Delete Word

```txt
Open word card menu
  ↓
Tap Delete
  ↓
Confirm
  ↓
Delete word
  ↓
Review logs are deleted by cascade
```

---

## 9. Review Flow

Review là flow học chính.

## 9.1 Start Daily Review

```txt
User tap Start Review
  ↓
Query due words:
      user_id = current user
      next_review_at <= now()
  ↓
Sort by next_review_at ASC
  ↓
Limit optional:
      max 20 words per session
  ↓
Create local review queue
  ↓
Open Review Screen
```

Recommended MVP limit:

```txt
20 words per day/session
```

Lý do:

- tránh quá tải
- dễ duy trì thói quen
- phù hợp học 5-15 phút/ngày

---

## 9.2 Start Deck Review

```txt
User vào Deck Detail
  ↓
Tap Start Review This Deck
  ↓
Query due words in this deck only
  ↓
Create review queue
  ↓
Open Review Screen
```

---

## 9.3 Flashcard Front

```txt
Show:
- Progress: 3/12
- Deck chip
- Word
- Phonetic
- Speaker button
- Hint: Tap to reveal
```

User actions:

```txt
Tap card → reveal back
Tap speaker → play pronunciation audio
```

---

## 9.4 Flashcard Back

```txt
Show:
- Word
- Phonetic
- Meaning
- Example if exists
- Example translation if exists
- Speaker button
- Forgot button
- Remembered button
```

User tự đánh giá, không có “đúng/sai” tự động.

---

## 9.4.1 Review Examples API

Review card examples are stored separately from the core word row:

```txt
word_examples
  word_id
  sentence
  translation optional
  sort_order 0..2
```

Review API/query should return:

```txt
word
deck summary
examples ordered by sort_order
```

Back card rendering:

```txt
0 examples -> hide examples section
1-2 examples -> show all
3 examples -> show first 2, allow expand to show all 3
```

---

## 9.5 Forgot Logic

When user taps Forgot:

```txt
previous_streak = current correct_streak
new_streak = 0

Update word:
  correct_streak = 0
  level = greatest(level - 1, 0)
  review_count += 1
  forgot_count += 1
  next_review_at = now() + 1 day
  last_reviewed_at = now()

Insert review_logs:
  result = forgot
  previous_streak
  new_streak = 0
```

Then:

```txt
Move to next card
```

Microcopy:

```txt
No worries, we’ll review it again soon.
```

---

## 9.6 Remembered Logic

When user taps Remembered:

```txt
previous_streak = current correct_streak
new_streak = previous_streak + 1

Calculate interval:
  streak 1  → +2 days
  streak 2  → +5 days
  streak 3  → +10 days
  streak 4  → +20 days
  streak 5+ → +30 days

Update word:
  correct_streak = new_streak
  level += 1
  review_count += 1
  remembered_count += 1
  next_review_at = now() + interval
  last_reviewed_at = now()

Insert review_logs:
  result = remembered
  previous_streak
  new_streak
```

Then:

```txt
Move to next card
```

Microcopy:

```txt
Nice work.
```

---

## 9.7 Review Complete

```txt
Queue empty
  ↓
Calculate session result:
      total_reviewed
      remembered_count
      forgot_count
  ↓
Update streak if needed
  ↓
Show Review Complete screen
```

Actions:

```txt
Back Home
Add New Word
Review another deck
```

---

## 10. Reminder Flow

## 10.1 Reminder Setup

```txt
User open Reminder Settings
  ↓
Toggle enable
  ↓
Choose time
  ↓
Choose repeat days
  ↓
Save
  ↓
Update Supabase reminder_settings
  ↓
Schedule local notification using Expo Notifications
```

Fields:

```txt
enabled
reminder_time
timezone
repeat_days
message
```

---

## 10.2 Reminder Trigger

```txt
At selected time
  ↓
Expo local notification fires
  ↓
User taps notification
  ↓
Open app
  ↓
Navigate to Home or Review
```

Recommended notification message:

```txt
Time to review your English words.
```

---

## 10.3 Reminder Technical Rule

Supabase Realtime is NOT used for push notifications when app is closed.

Use:

```txt
Expo Notifications → actual reminder
Supabase → store reminder settings
Supabase Realtime → sync setting while app is open
```

---

## 11. Realtime Sync Flow

## 11.1 Purpose

Realtime chỉ dùng để sync dữ liệu khi app đang mở.

Use cases:

- User dùng nhiều thiết bị
- Data thay đổi ở thiết bị A, thiết bị B cập nhật
- Review xong, Home due count update
- Reminder setting change sync

---

## 11.2 Subscribed Tables

```txt
decks
words
review_logs
reminder_settings
```

Events:

```txt
INSERT
UPDATE
DELETE
```

---

## 11.3 Flow

```txt
User logged in
  ↓
App creates realtime channel
  ↓
Subscribe Postgres changes
  ↓
Receive event
  ↓
Check event.user_id = current user
  ↓
Update Zustand store
  ↓
UI updates
```

---

## 12. Stats Flow

## 12.1 Home Stats

Stats:

```txt
due_today
total_words
mastered_words
current_streak
```

## 12.2 Profile Stats

Stats:

```txt
current_streak
total_words
mastered_words
review_accuracy
total_reviews
```

## 12.3 Review Accuracy

```txt
remembered_count / total_review_count * 100
```

## 12.4 Mastered Word

```txt
correct_streak >= 5
```

## 12.5 Current Streak MVP

Simple streak logic:

```txt
If user completes at least 1 review today:
  today is active day

Current streak:
  count consecutive active days backwards from today
```

Source:

```txt
review_logs.reviewed_at
```

---

## 13. Import Flow - Later Phase

Import không phải MVP core, nhưng có thể thêm phase sau.

## 13.1 Import CSV Flow

```txt
User select CSV
  ↓
Parse file
  ↓
Validate columns:
      word
      meaning
      deck
      optional example
  ↓
Preview import
  ↓
User confirm
  ↓
Insert words
  ↓
Set status = new
  ↓
Do not overload daily review
```

## 13.2 Important Import Rule

Không đưa toàn bộ 500 từ vào review ngay.

Recommended:

```txt
Only introduce 5-10 imported new words per day.
```

---

## 14. AI Flow - Later Phase

Không cần cho MVP.

Possible AI features:

```txt
Generate example sentence
Suggest meaning
Suggest deck
Explain word
Generate mini quiz
```

Recommended AI Add Word Flow:

```txt
User inputs word
  ↓
Dictionary fetch phonetic/audio
  ↓
AI suggests:
      meaning
      example
      example_translation
  ↓
User edits
  ↓
Save
```

---

## 15. MVP Final Flow

MVP nên chốt:

```txt
Auth
  ↓
Home
  ↓
Quick Add / Add Word
  ↓
Auto fetch phonetic + audio
  ↓
Daily Review
  ↓
Forgot / Remembered
  ↓
Spaced repetition
  ↓
Reminder
```

Must-have:

```txt
Sign up / sign in with username + password
Deck CRUD
Word CRUD
Quick Add
Auto phonetic/audio fetch
Daily review
Simple spaced repetition
Review logs
Reminder with Expo Notifications
Basic stats
```

Should-have:

```txt
Realtime sync
Search words
Filter words
Streak
```

Later:

```txt
Import CSV
AI suggestions
Quiz mode
Dark mode
Offline-first
```
