-- Schema: Qur'an Verse Challenge
-- Requires: Supabase/Postgres 15+

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Helper: current authenticated user id
create or replace function app_current_user_id()
returns uuid language sql stable as $$
  select auth.uid();
$$;

-- Helper: current user role from app users table
create or replace function app_current_user_role()
returns text language sql stable as $$
  select u.role from public.users u where u.id = auth.uid();
$$;

-- Helper: is current user a teacher of a given student via shared group
create or replace function is_teacher_over_student(student_id uuid)
returns boolean language sql stable as $$
  with my_teacher_groups as (
    select gm.group_id
    from public.group_members gm
    where gm.user_id = auth.uid() and gm.role = 'teacher'
  )
  select exists (
    select 1
    from public.group_members gm
    join my_teacher_groups t on t.group_id = gm.group_id
    where gm.user_id = student_id
  );
$$;

-- Users table (profiles)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'learner' check (role in ('learner','teacher','scholar','admin')),
  created_at timestamptz not null default now()
);

-- Verses
create table if not exists public.verses (
  id bigserial primary key,
  surah int not null,
  ayah int not null,
  arabic_text text not null,
  translation_en text,
  unique (surah, ayah)
);
create index if not exists idx_verses_surah_ayah on public.verses(surah, ayah);

-- Questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  verse_id bigint not null references public.verses(id) on delete cascade,
  prompt text not null,
  choices text[] not null,
  answer text not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete set null
);
create index if not exists idx_questions_approved on public.questions(approved_at);
create index if not exists idx_questions_verse on public.questions(verse_id);

-- Attempts
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  session_id uuid,
  response text,
  correct boolean,
  answered_at timestamptz not null default now(),
  constraint uq_attempt_once unique (user_id, question_id, session_id)
);
create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_attempts_question on public.attempts(question_id);

-- Streaks
create table if not exists public.streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  updated_at timestamptz not null default now()
);

-- Groups and membership (for teacher assignments)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_groups_owner on public.groups(owner_id);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','teacher')),
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists idx_group_members_user on public.group_members(user_id);

-- Assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_assignments_group on public.assignments(group_id);

create table if not exists public.assignment_questions (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null default 0,
  primary key (assignment_id, question_id)
);

-- Daily quiz materialization (optional; can be generated on the fly)
create table if not exists public.daily_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  quiz_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, quiz_date)
);

create table if not exists public.daily_quiz_questions (
  daily_quiz_id uuid not null references public.daily_quizzes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null,
  primary key (daily_quiz_id, question_id)
);

-- Quiz sessions (to resume state)
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_quiz_sessions_user on public.quiz_sessions(user_id);

-- View: approved questions only
create or replace view public.approved_questions as
  select * from public.questions q where q.approved_at is not null;

-- RLS Enable
alter table public.users enable row level security;
alter table public.verses enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.streaks enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.daily_quizzes enable row level security;
alter table public.daily_quiz_questions enable row level security;
alter table public.quiz_sessions enable row level security;

-- Policies
-- users: a user can select self; admins and scholars can select all
create policy users_self_select on public.users
  for select using (id = auth.uid() or app_current_user_role() in ('admin','scholar'));
create policy users_self_update on public.users
  for update using (id = auth.uid());

-- verses: readable by all authenticated; write by admin or scholar
create policy verses_read_all on public.verses
  for select using (auth.uid() is not null);
create policy verses_write_admin on public.verses
  for insert with check (app_current_user_role() in ('admin','scholar'));
create policy verses_update_admin on public.verses
  for update using (app_current_user_role() in ('admin','scholar'));

-- questions: select approved only unless scholar/admin/creator
create policy questions_select_policy on public.questions
  for select using (
    approved_at is not null
    or app_current_user_role() in ('admin','scholar')
    or created_by = auth.uid()
  );
create policy questions_insert_policy on public.questions
  for insert with check (app_current_user_role() in ('admin','scholar'));
create policy questions_update_policy on public.questions
  for update using (app_current_user_role() in ('admin','scholar'));

-- attempts: user can manage own; teachers can read attempts of their students
create policy attempts_self_rw on public.attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy attempts_teacher_read on public.attempts
  for select using (is_teacher_over_student(user_id));

-- streaks: user can manage own
create policy streaks_self_rw on public.streaks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- groups: owner manages; members can read
create policy groups_owner_rw on public.groups
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy groups_member_read on public.groups
  for select using (exists (
    select 1 from public.group_members gm
    where gm.group_id = public.groups.id and gm.user_id = auth.uid()
  ));

-- group_members: owner or teacher of group can manage; members read own group rows
create policy group_members_manage_teachers on public.group_members
  for all using (exists (
    select 1 from public.groups g
    join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid() and gm.role = 'teacher'
    where g.id = public.group_members.group_id
  )) with check (exists (
    select 1 from public.groups g
    join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid() and gm.role = 'teacher'
    where g.id = public.group_members.group_id
  ));
create policy group_members_read_members on public.group_members
  for select using (exists (
    select 1 from public.group_members gm
    where gm.group_id = public.group_members.group_id and gm.user_id = auth.uid()
  ));

-- assignments: teachers of group manage; members read
create policy assignments_manage_teachers on public.assignments
  for all using (exists (
    select 1 from public.group_members gm
    where gm.group_id = public.assignments.group_id and gm.user_id = auth.uid() and gm.role = 'teacher'
  )) with check (exists (
    select 1 from public.group_members gm
    where gm.group_id = public.assignments.group_id and gm.user_id = auth.uid() and gm.role = 'teacher'
  ));
create policy assignments_read_members on public.assignments
  for select using (exists (
    select 1 from public.group_members gm
    where gm.group_id = public.assignments.group_id and gm.user_id = auth.uid()
  ));

-- assignment_questions: teachers manage; members read
create policy assignment_questions_manage_teachers on public.assignment_questions
  for all using (exists (
    select 1 from public.assignments a
    join public.group_members gm on gm.group_id = a.group_id and gm.user_id = auth.uid() and gm.role = 'teacher'
    where a.id = public.assignment_questions.assignment_id
  )) with check (exists (
    select 1 from public.assignments a
    join public.group_members gm on gm.group_id = a.group_id and gm.user_id = auth.uid() and gm.role = 'teacher'
    where a.id = public.assignment_questions.assignment_id
  ));
create policy assignment_questions_read_members on public.assignment_questions
  for select using (exists (
    select 1 from public.assignments a
    join public.group_members gm on gm.group_id = a.group_id and gm.user_id = auth.uid()
    where a.id = public.assignment_questions.assignment_id
  ));

-- daily_quizzes: user manages own
create policy daily_quizzes_self_rw on public.daily_quizzes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy daily_quiz_questions_self_read on public.daily_quiz_questions
  for select using (exists (
    select 1 from public.daily_quizzes dq where dq.id = public.daily_quiz_questions.daily_quiz_id and dq.user_id = auth.uid()
  ));

-- quiz_sessions: user manages own
create policy quiz_sessions_self_rw on public.quiz_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Approval function (only scholar/admin)
create or replace function approve_question(p_question_id uuid)
returns void language plpgsql security definer as $$
begin
  if app_current_user_role() not in ('admin','scholar') then
    raise exception 'not authorized';
  end if;
  update public.questions
    set approved_at = now(), approved_by = auth.uid()
    where id = p_question_id;
end; $$;