-- Block 3A — Departments
create table departments (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,                        -- "Computer Science Engineering"
  short_name   text not null unique,                 -- "CSE"
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Seed initial departments
insert into departments (name, short_name) values
  ('Computer Science Engineering', 'CSE'),
  ('Electronics & Communication Engineering', 'ECE'),
  ('Mechanical Engineering', 'ME'),
  ('Civil Engineering', 'CE'),
  ('Information Technology', 'IT'),
  ('Electrical & Electronics Engineering', 'EEE');

-- Block 3B — Subjects
create table subjects (
  id              uuid primary key default uuid_generate_v4(),
  department_id   uuid not null references departments(id) on delete cascade,
  name            text not null,                   -- "Operating System"
  semester        smallint not null check (semester between 1 and 8),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (department_id, name, semester)
);

create index idx_subjects_department on subjects(department_id);
create index idx_subjects_semester on subjects(department_id, semester);

-- Block 3C — Subject Aliases
create table subject_aliases (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  alias       text not null,                       -- "OS", "Op Sys", "Operating System"
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (subject_id, alias)
);

create index idx_subject_aliases_subject on subject_aliases(subject_id);
create index idx_subject_aliases_trgm on subject_aliases using gin (alias gin_trgm_ops);

-- Block 3D — Profiles
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text not null,
  roll_number      text unique,                     -- null until college form is completed
  department_id    uuid references departments(id) on delete set null,
  year             year_level,                      -- auto-upgrades via function
  role             user_role not null default 'student',
  status           account_status not null default 'active',
  password_hash    text,                            -- bcrypt hash for roll number login
  avatar_url       text,                            -- from Google or null
  google_id        text unique,                     -- Google sub claim
  email            text not null unique,
  college_form_completed boolean not null default false,
  last_active_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_profiles_roll_number on profiles(roll_number);
create index idx_profiles_department on profiles(department_id);
create index idx_profiles_role on profiles(role);
create index idx_profiles_status on profiles(status);

-- Block 3E — Moderator Assignments
create table moderator_assignments (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  department_id   uuid not null references departments(id) on delete cascade,
  assigned_by     uuid references profiles(id) on delete set null,  -- admin who assigned
  assigned_at     timestamptz not null default now(),
  unique (user_id, department_id)
);

create index idx_mod_assignments_user on moderator_assignments(user_id);
create index idx_mod_assignments_dept on moderator_assignments(department_id);
