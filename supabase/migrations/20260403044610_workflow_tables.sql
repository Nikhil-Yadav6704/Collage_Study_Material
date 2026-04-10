-- Block 5A — Upload Requests (from students)
create table upload_requests (
  id                  uuid primary key default uuid_generate_v4(),
  submitted_by        uuid not null references profiles(id) on delete cascade,
  title               text not null,
  material_type       material_type not null,
  subject_id          uuid not null references subjects(id) on delete restrict,
  department_id       uuid not null references departments(id) on delete restrict,
  semester            smallint not null check (semester between 1 and 8),
  year_restriction    year_level not null,
  student_note        text,

  -- File (student uploads to a temp R2 location)
  file_key            text,
  file_name           text,
  file_size_bytes     bigint,
  external_url        text,

  -- Review
  status              request_status not null default 'pending',
  reviewed_by         uuid references profiles(id) on delete set null,
  reviewed_at         timestamptz,
  rejection_reason    text,
  review_note         text,           -- "Approved with edits to title and tags"

  -- If approved: link to the created material
  resulting_material_id uuid references materials(id) on delete set null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Add the FK we deferred in materials table
alter table materials
  add constraint fk_materials_source_request
  foreign key (source_request_id) references upload_requests(id) on delete set null;

create index idx_upload_requests_submitter on upload_requests(submitted_by);
create index idx_upload_requests_dept on upload_requests(department_id);
create index idx_upload_requests_status on upload_requests(status);

-- Block 5B — Moderator Requests (students requesting moderator role)
create table moderator_requests (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  department_id    uuid not null references departments(id) on delete cascade,
  reason           text,
  status           moderator_request_status not null default 'pending',
  reviewed_by      uuid references profiles(id) on delete set null,
  reviewed_at      timestamptz,
  admin_message    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_mod_requests_user on moderator_requests(user_id);
create index idx_mod_requests_status on moderator_requests(status);
