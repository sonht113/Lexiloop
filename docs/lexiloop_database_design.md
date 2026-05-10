# LexiLoop - Database Design

## 1. Overview

Database sử dụng:

```txt
Supabase PostgreSQL
```

Database cần hỗ trợ flow chính:

```txt
Username/password auth
Deck management
Quick Add word
Auto phonetic/audio storage
Daily review
Spaced repetition
Review logs
Reminder settings
Realtime sync
```

---

## 2. Entity Relationship

```txt
auth.users
  └── profiles
        ├── decks
        │     └── words
        │           └── review_logs
        │
        └── reminder_settings
```

---

## 3. Tables

## 3.1 auth.users

Đây là bảng do Supabase Auth quản lý.

App không trực tiếp tạo bảng này.

Auth strategy:

```txt
User nhập username + password
App convert username → username@lexiloop.local
Supabase Auth dùng email/password
```

Example:

```txt
username: sondev
internal email: sondev@lexiloop.local
```

---

## 3.2 profiles

Lưu thông tin user hiển thị trong app.

| Column | Type | Required | Description |
|---|---|---:|---|
| id | uuid | yes | Trùng auth.users.id |
| username | text | yes | Tên đăng nhập |
| display_name | text | no | Tên hiển thị |
| avatar_url | text | no | Avatar |
| created_at | timestamptz | yes | Thời điểm tạo |
| updated_at | timestamptz | yes | Thời điểm cập nhật |

Constraints:

```txt
id primary key
id references auth.users(id)
username unique
```

---

## 3.3 decks

Lưu bộ từ vựng.

| Column | Type | Required | Description |
|---|---|---:|---|
| id | uuid | yes | Deck ID |
| user_id | uuid | yes | Owner |
| name | text | yes | Tên deck |
| description | text | no | Mô tả |
| icon | text | no | Emoji/icon |
| color | text | no | Màu deck |
| created_at | timestamptz | yes | Thời điểm tạo |
| updated_at | timestamptz | yes | Thời điểm cập nhật |

Constraints:

```txt
id primary key
user_id references auth.users(id)
unique(user_id, name)
```

Delete rule:

```txt
Delete deck → delete words inside deck
```

---

## 3.4 words

Lưu từng từ vựng.

Bảng này là core của app.

| Column | Type | Required | Description |
|---|---|---:|---|
| id | uuid | yes | Word ID |
| user_id | uuid | yes | Owner |
| deck_id | uuid | yes | Deck chứa word |
| word | text | yes | Từ tiếng Anh |
| meaning | text | yes | Nghĩa tiếng Việt |
| phonetic | text | no | Phiên âm IPA |
| audio_url | text | no | Link audio phát âm |
| example | text | no | Câu ví dụ |
| example_translation | text | no | Dịch câu ví dụ |
| notes | text | no | Ghi chú |
| tags | text[] | no | Tags |
| level | int | yes | Level ghi nhớ |
| correct_streak | int | yes | Số lần nhớ liên tiếp |
| review_count | int | yes | Tổng số lần review |
| forgot_count | int | yes | Số lần quên |
| remembered_count | int | yes | Số lần nhớ |
| next_review_at | timestamptz | yes | Lịch ôn tiếp theo |
| last_reviewed_at | timestamptz | no | Lần ôn gần nhất |
| created_at | timestamptz | yes | Thời điểm tạo |
| updated_at | timestamptz | yes | Thời điểm cập nhật |

Default for new word:

```txt
level = 0
correct_streak = 0
review_count = 0
forgot_count = 0
remembered_count = 0
next_review_at = now()
last_reviewed_at = null
```

Status logic:

```txt
New:
review_count = 0

Due:
next_review_at <= now()

Learning:
review_count > 0 AND correct_streak < 5

Mastered:
correct_streak >= 5
```

---

## 3.5 review_logs

Lưu lịch sử mỗi lần user review một word.

| Column | Type | Required | Description |
|---|---|---:|---|
| id | uuid | yes | Review log ID |
| user_id | uuid | yes | Owner |
| word_id | uuid | yes | Word được review |
| deck_id | uuid | yes | Deck tại thời điểm review |
| result | text | yes | forgot / remembered |
| previous_streak | int | no | Streak trước review |
| new_streak | int | no | Streak sau review |
| reviewed_at | timestamptz | yes | Thời điểm review |

Constraints:

```txt
result in ('forgot', 'remembered')
word_id references words(id) on delete cascade
deck_id references decks(id) on delete cascade
```

Dùng cho:

- stats
- streak
- accuracy
- review history

---

## 3.6 reminder_settings

Lưu cài đặt nhắc học.

Reminder thật sự được schedule bằng Expo Notifications trên thiết bị.

Supabase chỉ lưu setting để sync.

| Column | Type | Required | Description |
|---|---|---:|---|
| id | uuid | yes | Setting ID |
| user_id | uuid | yes | Owner |
| enabled | boolean | yes | Bật/tắt reminder |
| reminder_time | time | yes | Giờ nhắc |
| timezone | text | yes | Timezone |
| repeat_days | int[] | yes | Ngày lặp lại |
| message | text | no | Nội dung nhắc |
| created_at | timestamptz | yes | Thời điểm tạo |
| updated_at | timestamptz | yes | Thời điểm cập nhật |

repeat_days convention:

```txt
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

Default:

```txt
enabled = false
reminder_time = 20:00
timezone = Asia/Ho_Chi_Minh
repeat_days = [0,1,2,3,4,5,6]
message = Time to review your English words.
```

---

## 4. SQL Schema

```sql
create extension if not exists "pgcrypto";

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- decks
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

-- words
create table public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  word text not null,
  meaning text not null,
  phonetic text,
  audio_url text,
  example text,
  example_translation text,
  notes text,
  tags text[] not null default '{}',

  level int not null default 0 check (level >= 0),
  correct_streak int not null default 0 check (correct_streak >= 0),
  review_count int not null default 0 check (review_count >= 0),
  forgot_count int not null default 0 check (forgot_count >= 0),
  remembered_count int not null default 0 check (remembered_count >= 0),

  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- review_logs
create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  result text not null check (result in ('forgot', 'remembered')),
  previous_streak int,
  new_streak int,
  reviewed_at timestamptz not null default now()
);

-- reminder_settings
create table public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  enabled boolean not null default false,
  reminder_time time not null default '20:00',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  repeat_days int[] not null default '{0,1,2,3,4,5,6}',
  message text default 'Time to review your English words.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 5. Indexes

```sql
create index profiles_username_idx on public.profiles(username);

create index decks_user_id_idx on public.decks(user_id);
create index decks_user_created_idx on public.decks(user_id, created_at desc);

create index words_user_id_idx on public.words(user_id);
create index words_deck_id_idx on public.words(deck_id);
create index words_next_review_at_idx on public.words(next_review_at);
create index words_user_due_idx on public.words(user_id, next_review_at);
create index words_user_deck_idx on public.words(user_id, deck_id);
create index words_user_word_idx on public.words(user_id, word);

create index review_logs_user_id_idx on public.review_logs(user_id);
create index review_logs_word_id_idx on public.review_logs(word_id);
create index review_logs_deck_id_idx on public.review_logs(deck_id);
create index review_logs_reviewed_at_idx on public.review_logs(reviewed_at);
create index review_logs_user_reviewed_idx on public.review_logs(user_id, reviewed_at desc);

create index reminder_settings_user_id_idx on public.reminder_settings(user_id);
```

---

## 6. Updated At Trigger

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_decks_updated_at
before update on public.decks
for each row execute function public.set_updated_at();

create trigger set_words_updated_at
before update on public.words
for each row execute function public.set_updated_at();

create trigger set_reminder_settings_updated_at
before update on public.reminder_settings
for each row execute function public.set_updated_at();
```

---

## 7. Row Level Security

Enable RLS:

```sql
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.words enable row level security;
alter table public.review_logs enable row level security;
alter table public.reminder_settings enable row level security;
```

---

## 8. RLS Policies

## 8.1 profiles

```sql
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
```

---

## 8.2 decks

```sql
create policy "Users can view own decks"
on public.decks
for select
using (auth.uid() = user_id);

create policy "Users can insert own decks"
on public.decks
for insert
with check (auth.uid() = user_id);

create policy "Users can update own decks"
on public.decks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own decks"
on public.decks
for delete
using (auth.uid() = user_id);
```

---

## 8.3 words

```sql
create policy "Users can view own words"
on public.words
for select
using (auth.uid() = user_id);

create policy "Users can insert own words"
on public.words
for insert
with check (auth.uid() = user_id);

create policy "Users can update own words"
on public.words
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own words"
on public.words
for delete
using (auth.uid() = user_id);
```

---

## 8.4 review_logs

```sql
create policy "Users can view own review logs"
on public.review_logs
for select
using (auth.uid() = user_id);

create policy "Users can insert own review logs"
on public.review_logs
for insert
with check (auth.uid() = user_id);
```

Review logs thường không cần update/delete trong MVP.

---

## 8.5 reminder_settings

```sql
create policy "Users can view own reminder settings"
on public.reminder_settings
for select
using (auth.uid() = user_id);

create policy "Users can insert own reminder settings"
on public.reminder_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own reminder settings"
on public.reminder_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

---

## 9. Core Queries

## 9.1 Get Due Words

```sql
select *
from public.words
where user_id = auth.uid()
  and next_review_at <= now()
order by next_review_at asc
limit 20;
```

---

## 9.2 Get Due Words By Deck

```sql
select *
from public.words
where user_id = auth.uid()
  and deck_id = :deck_id
  and next_review_at <= now()
order by next_review_at asc
limit 20;
```

---

## 9.3 Get Decks With Counts

```sql
select
  d.*,
  count(w.id) as total_words,
  count(w.id) filter (where w.next_review_at <= now()) as due_words,
  count(w.id) filter (where w.correct_streak >= 5) as mastered_words
from public.decks d
left join public.words w on w.deck_id = d.id
where d.user_id = auth.uid()
group by d.id
order by d.created_at desc;
```

---

## 9.4 Get Home Stats

```sql
select
  count(*) as total_words,
  count(*) filter (where next_review_at <= now()) as due_today,
  count(*) filter (where correct_streak >= 5) as mastered_words
from public.words
where user_id = auth.uid();
```

---

## 9.5 Get Review Accuracy

```sql
select
  count(*) filter (where result = 'remembered') as remembered,
  count(*) as total,
  case
    when count(*) = 0 then 0
    else round(
      count(*) filter (where result = 'remembered')::numeric / count(*)::numeric * 100,
      2
    )
  end as accuracy
from public.review_logs
where user_id = auth.uid();
```

---

## 10. Review Update Logic

## 10.1 Forgot

```sql
update public.words
set
  correct_streak = 0,
  level = greatest(level - 1, 0),
  review_count = review_count + 1,
  forgot_count = forgot_count + 1,
  next_review_at = now() + interval '1 day',
  last_reviewed_at = now()
where id = :word_id
  and user_id = auth.uid();
```

Insert log:

```sql
insert into public.review_logs (
  user_id,
  word_id,
  deck_id,
  result,
  previous_streak,
  new_streak
)
values (
  auth.uid(),
  :word_id,
  :deck_id,
  'forgot',
  :previous_streak,
  0
);
```

---

## 10.2 Remembered

Spaced repetition interval:

```txt
new_streak = 1  → +2 days
new_streak = 2  → +5 days
new_streak = 3  → +10 days
new_streak = 4  → +20 days
new_streak >= 5 → +30 days
```

Update word:

```sql
update public.words
set
  correct_streak = correct_streak + 1,
  level = level + 1,
  review_count = review_count + 1,
  remembered_count = remembered_count + 1,
  next_review_at = :next_review_at,
  last_reviewed_at = now()
where id = :word_id
  and user_id = auth.uid();
```

Insert log:

```sql
insert into public.review_logs (
  user_id,
  word_id,
  deck_id,
  result,
  previous_streak,
  new_streak
)
values (
  auth.uid(),
  :word_id,
  :deck_id,
  'remembered',
  :previous_streak,
  :new_streak
);
```

---

## 11. Suggested RPC For Review Answer

Để tránh race condition, phase sau nên tạo RPC:

```txt
answer_word_review(
  p_word_id uuid,
  p_result text
)
```

Function sẽ:

- Lấy current word
- Tính previous_streak
- Tính new_streak
- Tính next_review_at
- Update words
- Insert review_logs
- Return updated word

MVP có thể làm ở app service trước.

---

## 12. Realtime Setup

Enable realtime for:

```txt
decks
words
review_logs
reminder_settings
```

Client subscribe:

```txt
postgres_changes
event: *
schema: public
table: words
filter: user_id=eq.{user_id}
```

Same pattern for decks, review_logs, reminder_settings.

---

## 13. Reminder Data Flow

Reminder save:

```txt
Update reminder_settings in Supabase
Schedule Expo local notification on device
```

Important:

```txt
Database không bắn notification.
```

If user logs in on new device:

```txt
Fetch reminder_settings
If enabled:
  schedule local notification on new device
```

---

## 14. Dictionary Data Flow

Dictionary API response should be normalized before saving.

Save into words:

```txt
phonetic
audio_url
```

If no data:

```txt
phonetic = null
audio_url = null
```

Save should still succeed.

---

## 15. Data Ownership Rule

Every user-owned table has:

```txt
user_id
```

All app queries must filter by current user.

RLS protects:

```txt
User A cannot read/write User B data.
```

---

## 16. MVP Database Checklist

- [x] profiles
- [x] decks
- [x] words
- [x] audio_url for pronunciation
- [x] review_logs
- [x] reminder_settings
- [x] indexes
- [x] RLS
- [x] RLS policies
- [x] updated_at trigger
- [x] spaced repetition fields
- [x] realtime-ready tables
