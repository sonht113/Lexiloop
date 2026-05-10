# LexiLoop - System Design & Page Specification

## 1. Product Overview

LexiLoop là app mobile học từ vựng tiếng Anh bằng flashcards, tập trung vào việc:

- Tự thêm từ vựng nhanh
- Tự động lấy phiên âm và audio phát âm
- Ôn tập hằng ngày bằng spaced repetition
- Nhắc học mỗi ngày
- Theo dõi tiến độ đơn giản
- Đồng bộ dữ liệu bằng Supabase

Triết lý sản phẩm:

```txt
Add word fast → Review daily → Remember long term
```

Mục tiêu không phải là có thật nhiều tính năng, mà là giúp người dùng duy trì thói quen học từ vựng đều đặn.

---

## 2. Design Principles

### 2.1 Simple First

Mỗi màn hình chỉ nên có một nhiệm vụ chính.

Ví dụ:

- Home: biết hôm nay cần học gì
- Add Word: thêm từ thật nhanh
- Review: tập trung ôn một từ tại một thời điểm
- Decks: quản lý nhóm từ
- Profile: xem thống kê và cài đặt

---

### 2.2 Fast Vocabulary Capture

Vì user sẽ thêm từ thường xuyên, flow thêm từ phải cực nhanh.

Người dùng chỉ cần nhập tối thiểu:

```txt
word + meaning
```

App sẽ tự động xử lý:

- fetch phonetic
- fetch pronunciation audio
- gợi ý dữ liệu nếu có
- lưu vào deck

Không bắt buộc nhập example, phonetic hoặc note.

---

### 2.3 No Shame Learning

Khi user chọn “Forgot”, app không dùng ngôn ngữ tiêu cực.

Tránh:

- Wrong
- Failed
- Bad

Nên dùng:

- No worries
- We’ll review it again soon
- Keep going

---

### 2.4 Calm & Focused UI

UI nên nhẹ, sạch, có nhiều khoảng trắng.

Phong cách:

- Soft card
- Rounded corner
- Ít màu
- Typography rõ ràng
- CTA nổi bật
- Không quá gamification

---

## 3. Brand Direction

App name:

```txt
LexiLoop
```

Ý nghĩa:

- Lexi: vocabulary / lexicon
- Loop: vòng lặp ôn tập

Brand personality:

- Friendly
- Calm
- Encouraging
- Clean
- Slightly playful
- Not childish
- Not too academic

Tone of voice:

- Thân thiện
- Ngắn gọn
- Khuyến khích
- Không gây áp lực

Microcopy examples:

```txt
Ready to review?
You have 12 words due today.
Small steps every day.
Forgot it? No worries, we’ll show it again soon.
All done for today.
Great job. Come back tomorrow.
```

---

## 4. Visual Design System

## 4.1 Colors

### Primary

```txt
Indigo Blue: #4F46E5
```

Use for:

- Main CTA
- Active tab
- Progress indicator
- Focus state
- Important highlights

### Secondary

```txt
Soft Purple: #A78BFA
```

Use for:

- Decorative accents
- Secondary highlights
- Soft illustration background

### Success

```txt
Green: #22C55E
```

Use for:

- Remembered button
- Completed review
- Mastered words

### Warning

```txt
Amber: #F59E0B
```

Use for:

- Due words
- Reminder
- Attention badge

### Error / Danger

```txt
Red: #EF4444
```

Use for:

- Delete action
- Forgot state
- Error message

### Background

```txt
App Background: #F8FAFC
Card Background: #FFFFFF
Soft Section Background: #EEF2FF
Muted Background: #F1F5F9
```

### Text

```txt
Primary Text: #0F172A
Secondary Text: #475569
Muted Text: #94A3B8
Text on Primary: #FFFFFF
```

### Border

```txt
Default Border: #E2E8F0
Focus Border: #818CF8
Divider: #E5E7EB
```

---

## 4.2 Typography

Suggested fonts:

- Inter
- SF Pro
- Google Sans
- Nunito Sans

Type scale:

| Token | Size | Weight | Usage |
|---|---:|---|---|
| Display | 32px | Bold | Big number, hero stat |
| Page Title | 24px | Bold | Screen title |
| Section Title | 18px | Semibold | Card title |
| Body | 16px | Regular | Main content |
| Body Medium | 16px | Medium | Label emphasis |
| Caption | 13px | Regular | Helper text |
| Small Label | 12px | Medium | Badge, chip |

---

## 4.3 Spacing

Use 8px spacing system.

```txt
4px  = tiny gap
8px  = small gap
12px = compact spacing
16px = standard spacing
20px = screen padding
24px = section padding
32px = large spacing
40px = hero spacing
```

Screen horizontal padding:

```txt
20px
```

Card internal padding:

```txt
16px - 24px
```

---

## 4.4 Radius

```txt
Small: 8px
Medium: 12px
Large: 16px
Card: 20px
Hero Card: 24px
Pill: 999px
```

---

## 4.5 Shadow

Use subtle shadow only.

Card shadow style:

```txt
Blur: 16px
Opacity: low
Offset: small
No harsh contrast
```

---

## 4.6 Icons

Recommended icon library:

```txt
lucide-react-native
```

Icon style:

- Outline
- Rounded stroke
- Minimal
- No heavy filled icons

Common icons:

- Home
- BookOpen
- Layers
- User
- Plus
- Search
- Volume2
- Bell
- Check
- RotateCcw
- Trash
- Pencil
- Flame

---

## 5. Navigation Structure

## 5.1 Root Navigation

```txt
RootNavigator
  ├── AuthStack
  │     ├── Onboarding
  │     ├── SignIn
  │     └── SignUp
  │
  └── MainTabs
        ├── Home
        ├── Review
        ├── Decks
        └── Profile
```

## 5.2 Modal / Stack Screens

```txt
MainStack
  ├── MainTabs
  ├── AddWord
  ├── EditWord
  ├── AddDeck
  ├── DeckDetail
  ├── ReminderSettings
  └── ReviewComplete
```

## 5.3 Bottom Tab

Tabs:

1. Home
2. Review
3. Decks
4. Profile

Tab style:

- White background
- Subtle top border
- Active: #4F46E5
- Inactive: #94A3B8
- Icon + label
- Height comfortable for thumb

---

## 6. Global Components

## 6.1 Screen

Use for all screens.

Properties:

- Safe area support
- Background #F8FAFC
- Horizontal padding 20px
- Optional scroll
- Optional bottom CTA

---

## 6.2 Button

### Primary Button

Usage:

- Start Review
- Save Word
- Sign In
- Sign Up

Style:

```txt
Height: 52px
Radius: 16px
Background: #4F46E5
Text: #FFFFFF
Font: 16px Semibold
```

### Secondary Button

Style:

```txt
Background: #EEF2FF
Text: #4F46E5
Radius: 16px
```

### Success Button

Usage:

- Remembered

Style:

```txt
Background: #22C55E
Text: #FFFFFF
```

### Danger Soft Button

Usage:

- Forgot
- Delete confirm

Style:

```txt
Background: #FEE2E2
Text: #EF4444
```

### Ghost Button

Usage:

- Cancel
- Skip
- Edit secondary action

Style:

```txt
Background: Transparent
Text: #4F46E5
```

---

## 6.3 Card

Default card:

```txt
Background: #FFFFFF
Radius: 20px
Padding: 16px
Border: optional #E2E8F0
Shadow: soft
```

Hero card:

```txt
Background: #EEF2FF or gradient
Radius: 24px
Padding: 24px
```

Flashcard:

```txt
Background: #FFFFFF
Radius: 24px
Padding: 28px
Min height: 360px
Shadow: soft
```

---

## 6.4 Input

Style:

```txt
Height: 52px
Radius: 14px
Background: #FFFFFF
Border: #E2E8F0
Focus Border: #818CF8
Padding Horizontal: 16px
Label above input
Helper text below input
```

Required field indicator:

```txt
Word *
Meaning *
Deck *
```

---

## 6.5 Badge / Chip

Style:

```txt
Radius: 999px
Padding Vertical: 6px
Padding Horizontal: 10px
Font: 12px Medium
```

Badge types:

### Due

```txt
Background: #FEF3C7
Text: #92400E
```

### New

```txt
Background: #EEF2FF
Text: #4F46E5
```

### Mastered

```txt
Background: #DCFCE7
Text: #166534
```

### Forgot

```txt
Background: #FEE2E2
Text: #991B1B
```

---

## 6.6 Progress Bar

Style:

```txt
Height: 8px
Radius: 999px
Background: #E2E8F0
Fill: #4F46E5
```

Use for:

- Review progress
- Deck progress
- Daily completion

---

## 6.7 Toast

Use for:

- Word saved
- Deck created
- Reminder enabled
- Error fetch phonetic
- Delete completed

Tone:

- Short
- Friendly
- Not intrusive

Examples:

```txt
Word saved.
Reminder set for 8:00 PM.
Couldn’t fetch pronunciation. You can still save this word.
```

---

## 7. Page Specifications

# 7.1 Onboarding Screen

## Purpose

Giới thiệu nhanh app cho user mới.

## Layout

```txt
Top:
- App logo
- App name: LexiLoop

Center:
- Illustration / icon
- Title
- Subtitle

Bottom:
- Primary CTA: Get started
- Secondary CTA: I already have an account
```

## Onboarding Slides

### Slide 1

Title:

```txt
Learn words that matter
```

Subtitle:

```txt
Create your own vocabulary decks and study at your pace.
```

### Slide 2

Title:

```txt
Review at the right time
```

Subtitle:

```txt
LexiLoop helps you remember with simple spaced repetition.
```

### Slide 3

Title:

```txt
Build a daily habit
```

Subtitle:

```txt
Set reminders and keep your learning streak alive.
```

## CTA

Primary:

```txt
Get started
```

Secondary:

```txt
I already have an account
```

---

# 7.2 Sign Up Screen

## Purpose

Tạo tài khoản bằng username + password.

## Fields

- Username
- Password
- Confirm password

## Important Product Rule

User chỉ thấy username/password.

App sẽ convert username thành email nội bộ:

```txt
{username}@lexiloop.local
```

## Layout

```txt
Top:
- Back button
- Title: Create account
- Subtitle: Start building your vocabulary loop.

Form:
- Username input
- Password input
- Confirm password input

Bottom:
- Primary CTA: Create account
- Link: Already have an account? Sign in
```

## Validation

- Username required
- Username minimum 3 characters
- Password minimum 6 characters
- Confirm password must match

## Error Copy

```txt
Username is required.
Password must be at least 6 characters.
Passwords do not match.
This username is already taken.
```

---

# 7.3 Sign In Screen

## Purpose

Đăng nhập đơn giản bằng username + password.

## Layout

```txt
Top:
- App logo
- App name: LexiLoop
- Subtitle: Your personal English vocabulary trainer

Form:
- Username input
- Password input

Actions:
- Sign in
- Create account
```

## Empty State / Error

```txt
Invalid username or password.
```

---

# 7.4 Home Screen

## Purpose

Cho user biết hôm nay cần ôn bao nhiêu từ và bắt đầu học nhanh.

## Data

- username
- due words count
- daily review progress
- streak
- total words
- mastered words
- recent decks
- reminder status

## Layout

```txt
Header:
- Hi Sơn 👋
- Small subtitle: Ready to review your words?

Hero Card:
- Large number: 12
- Label: words due today
- Progress: 0/12 completed
- CTA: Start Review

Quick Actions:
- Quick Add
- Add Word
- Reminder

Stats Row:
- Streak
- Total Words
- Mastered

Reminder Card:
- Daily reminder
- Today at 8:00 PM
- Toggle state

Recent Decks:
- Deck cards
```

## Primary CTA Logic

If due_count > 0:

```txt
Start Review
```

If due_count = 0:

```txt
All done today
```

Secondary CTA:

```txt
Add New Word
```

## Empty State

If user has no words:

```txt
No words yet.
Add your first word and start learning today.
```

CTA:

```txt
Add first word
```

---

# 7.5 Quick Add Component

## Purpose

Thêm từ thật nhanh, dùng thường xuyên nhất.

## Entry Points

- Home quick action
- Deck detail floating button
- Review completed screen

## Minimal Fields

- Word
- Meaning
- Deck

## Auto Actions

After user enters word:

```txt
App fetches:
- phonetic
- audio URL
```

## Layout

Can be a bottom sheet.

```txt
Title: Quick Add

Fields:
- Word
- Meaning
- Deck selector

Auto pronunciation box:
- Loading: Fetching pronunciation...
- Success: /dɪˈplɔɪ/ + speaker button
- Failed: Couldn’t fetch pronunciation. You can still save.

Actions:
- Save
- Save & add another
```

## Important Rule

Không block save nếu fetch phonetic/audio fail.

---

# 7.6 Add Word Screen

## Purpose

Thêm từ với nhiều thông tin hơn Quick Add.

## Fields

Required:

- Word
- Meaning
- Deck

Optional:

- Example sentence
- Example translation
- Phonetic
- Audio URL
- Tags
- Notes

## Auto Fetch Flow

```txt
User types word
  ↓
Debounce or tap Fetch
  ↓
Call dictionary API
  ↓
Fill phonetic/audio if found
```

## Layout

```txt
Header:
- Title: Add word
- Save button optional

Form:
- Word
- Meaning
- Deck selector
- Auto pronunciation card
- Example sentence
- Example translation
- Tags
- Notes

Sticky Bottom:
- Save word
- Save & add another
```

## Auto Pronunciation Card States

### Loading

```txt
Fetching pronunciation...
```

### Success

```txt
/dɪˈplɔɪ/
Play audio
```

### Failed

```txt
Couldn’t fetch pronunciation. You can still save this word.
```

### Empty

```txt
Enter a word to fetch pronunciation.
```

---

# 7.7 Decks Screen

## Purpose

Quản lý nhóm từ vựng.

## Data

For each deck:

- name
- description
- icon
- total words
- due words
- mastered words
- progress

## Layout

```txt
Header:
- Title: Decks
- Add button

Search:
- Search decks

Deck List:
- Deck card
```

## Deck Card

Content:

```txt
Icon / emoji
Deck name
Total words
Due words badge
Progress bar
Mastered count
```

Example:

```txt
Developer English
32 words · 8 due
Progress 40%
```

## Empty State

```txt
No decks yet.
Create your first deck to organize your words.
```

CTA:

```txt
Create deck
```

---

# 7.8 Deck Detail / Word List Screen

## Purpose

Xem và quản lý words trong một deck.

## Data

- deck info
- words list
- total words
- due words
- mastered words

## Layout

```txt
Header:
- Back button
- Deck name
- More menu

Summary Card:
- Total words
- Due today
- Mastered

Actions:
- Start review this deck
- Add word

Filters:
- All
- Due
- New
- Learning
- Mastered

Search:
- Search words

Word List:
- Word cards
```

## Word Card

Content:

```txt
Word
Meaning preview
Phonetic
Status badge
Next review date
More menu
```

Status logic:

```txt
New: review_count = 0
Due: next_review_at <= now
Learning: review_count > 0 and correct_streak < 5
Mastered: correct_streak >= 5
```

---

# 7.9 Edit Word Screen

## Purpose

Chỉnh sửa từ đã lưu.

## Layout

Same as Add Word, but with existing values.

Actions:

- Save changes
- Delete word

Delete should require confirm modal.

Confirm copy:

```txt
Delete this word?
This action cannot be undone.
```

---

# 7.10 Review Screen - Card Front

## Purpose

Hiển thị mặt trước flashcard để user tự nhớ nghĩa.

## Data

- current word
- phonetic
- audio_url
- deck name
- progress

## Layout

```txt
Top:
- Progress: 3 / 12
- Progress bar

Center:
- Flashcard
  - Deck chip
  - Word large
  - Phonetic
  - Speaker button
  - Hint: Tap to reveal

Bottom:
- Optional: Skip for now
```

## Interaction

```txt
Tap card → reveal back
Tap speaker → play audio
```

---

# 7.11 Review Screen - Card Back

## Purpose

Hiển thị nghĩa và cho user tự đánh giá.

## Layout

```txt
Top:
- Progress: 3 / 12
- Progress bar

Card:
- Word
- Phonetic
- Meaning
- Example sentence if available
- Example translation if available
- Speaker button

Bottom Actions:
- Forgot
- Remembered
```

## Button Behavior

Forgot:

```txt
Soft red button
```

Remembered:

```txt
Green button
```

## Microcopy

After forgot:

```txt
No worries, we’ll review it again soon.
```

After remembered:

```txt
Nice work.
```

---

# 7.12 Review Complete Screen

## Purpose

Kết thúc phiên ôn, tạo cảm giác hoàn thành.

## Data

- total reviewed
- remembered count
- forgot count
- streak
- next review hint

## Layout

```txt
Top:
- Success icon / check

Title:
- All done for today

Stats:
- Reviewed: 12
- Remembered: 9
- Need practice: 3

Streak Card:
- 5 day streak

Actions:
- Back Home
- Add New Word
```

## Copy

```txt
Great job. Come back tomorrow.
```

---

# 7.13 Reminder Settings Screen

## Purpose

Cho user chọn giờ nhắc học.

## Important Technical Rule

Reminder thật sự dùng:

```txt
Expo Notifications
```

Supabase chỉ lưu setting.

Supabase Realtime chỉ sync khi app đang mở.

## Fields

- enabled
- reminder_time
- timezone
- repeat_days
- message

## Layout

```txt
Header:
- Title: Daily reminder

Main Card:
- Toggle enable reminder
- Time picker
- Days selector

Preview:
- Time to review your English words.

CTA:
- Save reminder
```

## Repeat Days UI

Chips:

```txt
Sun Mon Tue Wed Thu Fri Sat
```

## Empty / Disabled State

If disabled:

```txt
Reminder is off.
Turn it on to build your daily habit.
```

---

# 7.14 Profile Screen

## Purpose

Hiển thị thông tin user, stats và settings.

## Data

- username
- streak
- total words
- mastered words
- review accuracy
- reminder setting

## Layout

```txt
Header:
- Avatar placeholder
- Username

Stats:
- Current streak
- Total words
- Mastered
- Accuracy

Settings List:
- Reminder
- Theme
- Export data
- Sign out
```

## Sign Out

Confirm modal:

```txt
Sign out?
You can sign in again with your username and password.
```

---

## 8. Empty States

## No Words

```txt
No words yet.
Add your first word and start learning today.
```

CTA:

```txt
Add first word
```

## No Due Words

```txt
You’re all caught up.
Great job. Come back tomorrow.
```

CTA:

```txt
Add new word
```

## No Decks

```txt
No decks yet.
Create a deck to organize your vocabulary.
```

CTA:

```txt
Create deck
```

## Search No Results

```txt
No matching words found.
Try another keyword.
```

---

## 9. Loading States

## Home

Use skeleton cards for:

- hero card
- stats
- recent decks

## Add Word

Auto pronunciation loading:

```txt
Fetching pronunciation...
```

## Review

If loading due words:

```txt
Preparing your review...
```

---

## 10. Error States

## Auth Error

```txt
Invalid username or password.
```

## Network Error

```txt
Something went wrong. Please try again.
```

## Dictionary Fetch Failed

```txt
Couldn’t fetch pronunciation. You can still save this word.
```

## Save Failed

```txt
Couldn’t save this word. Please try again.
```

---

## 11. Accessibility

- Touch target minimum 44px
- High contrast text
- Do not rely only on color
- Buttons need text labels
- Speaker button should have accessible label
- Dynamic font should not break layout
- Focus state should be visible

---

## 12. Implementation Notes For Design

Design should be easy to implement in Expo React Native.

Avoid:

- Complex glassmorphism
- Heavy gradients everywhere
- Overlapping layouts
- Tiny tap targets
- Too many decorative elements

Prioritize:

- Reusable cards
- Reusable buttons
- Consistent spacing
- Clear page hierarchy
- Form states
- Empty states
- Review flow polish
