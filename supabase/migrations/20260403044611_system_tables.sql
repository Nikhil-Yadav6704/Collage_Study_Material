-- Block 6A — Notifications
create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  type            notification_type not null,
  title           text not null,
  body            text not null,
  is_read         boolean not null default false,
  metadata        jsonb,               -- extra context: { material_id, request_id, etc. }
  created_at      timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, is_read);
create index idx_notifications_created on notifications(created_at desc);

-- Block 6B — Activity Logs
create table activity_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references profiles(id) on delete set null,
  action       text not null,        -- 'download', 'login', 'upload', 'approve_request', etc.
  entity_type  text,                  -- 'material', 'upload_request', 'user', etc.
  entity_id    uuid,
  metadata     jsonb,                 -- extra detail: { department_id, material_type, etc. }
  ip_address   inet,
  created_at   timestamptz not null default now()
);

create index idx_activity_logs_user on activity_logs(user_id);
create index idx_activity_logs_action on activity_logs(action);
create index idx_activity_logs_created on activity_logs(created_at desc);

-- Block 6C — Login Security Logs
create table login_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references profiles(id) on delete set null,
  method       text not null,          -- 'google' or 'roll_number'
  ip_address   inet,
  user_agent   text,
  success      boolean not null,
  created_at   timestamptz not null default now()
);

create index idx_login_logs_user on login_logs(user_id, created_at desc);
