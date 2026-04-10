-- Block 4A — Materials
create table materials (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  description       text,
  material_type     material_type not null,
  subject_id        uuid not null references subjects(id) on delete restrict,
  department_id     uuid not null references departments(id) on delete restrict,
  semester          smallint not null check (semester between 1 and 8),
  year_restriction  year_level not null,

  -- File storage (Cloudflare R2)
  file_key          text,               -- R2 object key e.g. "materials/uuid/filename.pdf"
  file_name         text,               -- original filename
  file_size_bytes   bigint,
  file_mime_type    text,               -- "application/pdf" etc.

  -- External link (YouTube, Drive, etc.)
  external_url      text,
  url_domain        text,               -- extracted domain for display

  -- Computed
  download_count    integer not null default 0,
  average_rating    numeric(3,2),       -- cached, updated by trigger
  rating_count      integer not null default 0,

  -- Uploaded by
  uploaded_by       uuid not null references profiles(id) on delete restrict,
  is_from_request   boolean not null default false,   -- came from student upload request
  source_request_id uuid,               -- FK added after upload_requests table

  -- Status
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_materials_subject on materials(subject_id);
create index idx_materials_department on materials(department_id);
create index idx_materials_year on materials(year_restriction);
create index idx_materials_type on materials(material_type);
create index idx_materials_uploader on materials(uploaded_by);
create index idx_materials_active on materials(is_active, department_id, year_restriction);

-- Full text search vector column
alter table materials add column search_vector tsvector;
create index idx_materials_search on materials using gin(search_vector);

-- Block 4B — Study Guidelines
create table study_guidelines (
  id              uuid primary key default uuid_generate_v4(),
  subject_id      uuid not null references subjects(id) on delete cascade,
  department_id   uuid not null references departments(id) on delete cascade,
  content         text,                           -- rich text content (HTML or Markdown)
  word_count      integer not null default 0,
  status          guideline_status not null default 'draft',
  written_by      uuid references profiles(id) on delete set null,
  last_edited_by  uuid references profiles(id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (subject_id)                             -- one guideline per subject
);

create index idx_guidelines_subject on study_guidelines(subject_id);
create index idx_guidelines_dept on study_guidelines(department_id);

-- Block 4C — Bookmarks
create table bookmarks (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  material_id  uuid not null references materials(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (user_id, material_id)
);

create index idx_bookmarks_user on bookmarks(user_id);

-- Block 4D — Ratings & Comments
create table ratings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  material_id  uuid not null references materials(id) on delete cascade,
  score        smallint not null check (score between 1 and 5),
  comment      text,                         -- optional comment with the rating
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, material_id)             -- one rating per user per material
);

create index idx_ratings_material on ratings(material_id);
create index idx_ratings_user on ratings(user_id);

-- Block 4E — Comment Reports
create table comment_reports (
  id            uuid primary key default uuid_generate_v4(),
  rating_id     uuid not null references ratings(id) on delete cascade,
  reported_by   uuid not null references profiles(id) on delete cascade,  -- moderator
  reason        report_reason not null,
  note          text,
  is_resolved   boolean not null default false,
  resolved_by   uuid references profiles(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_comment_reports_rating on comment_reports(rating_id);
create index idx_comment_reports_resolved on comment_reports(is_resolved);
