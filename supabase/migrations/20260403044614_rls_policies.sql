-- Enable RLS on all public tables
alter table profiles enable row level security;
alter table materials enable row level security;
alter table subjects enable row level security;
alter table subject_aliases enable row level security;
alter table departments enable row level security;
alter table bookmarks enable row level security;
alter table ratings enable row level security;
alter table comment_reports enable row level security;
alter table study_guidelines enable row level security;
alter table upload_requests enable row level security;
alter table moderator_requests enable row level security;
alter table moderator_assignments enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
alter table login_logs enable row level security;
alter table roll_number_formats enable row level security;

-- Helper functions for RLS
create or replace function get_current_user_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function get_moderator_department()
returns uuid language sql security definer stable as $$
  select department_id from public.moderator_assignments where user_id = auth.uid() limit 1;
$$;

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_moderator()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'moderator');
$$;

-- RLS Policies

-- PROFILES
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
create policy "profiles: admin read all" on profiles for select using (is_admin());
create policy "profiles: mod read dept students" on profiles for select using (is_moderator() and department_id = get_moderator_department());
create policy "profiles: update own" on profiles for update using (auth.uid() = id);
create policy "profiles: admin update all" on profiles for update using (is_admin());

-- DEPARTMENTS
create policy "departments: public read" on departments for select using (true);
create policy "departments: admin write" on departments for all using (is_admin());

-- SUBJECTS
create policy "subjects: public read" on subjects for select using (true);
create policy "subjects: admin write" on subjects for all using (is_admin());
create policy "subjects: mod read own dept" on subjects for select using (is_moderator() and department_id = get_moderator_department());

-- SUBJECT ALIASES
create policy "aliases: public read" on subject_aliases for select using (true);
create policy "aliases: admin write" on subject_aliases for all using (is_admin());

-- MATERIALS
create policy "materials: student read own" on materials for select using (
    get_current_user_role() = 'student' and
    is_active = true and
    department_id = (select department_id from profiles where id = auth.uid()) and
    year_restriction = (select year from profiles where id = auth.uid())
);
create policy "materials: mod read own dept" on materials for select using (is_moderator() and department_id = get_moderator_department());
create policy "materials: mod write own dept" on materials for insert with check (is_moderator() and department_id = get_moderator_department());
create policy "materials: mod update own uploads" on materials for update using (is_moderator() and uploaded_by = auth.uid());
create policy "materials: mod delete own uploads" on materials for delete using (is_moderator() and uploaded_by = auth.uid());
create policy "materials: admin full" on materials for all using (is_admin());

-- BOOKMARKS
create policy "bookmarks: own only" on bookmarks for all using (user_id = auth.uid());

-- RATINGS
create policy "ratings: authenticated read" on ratings for select using (auth.role() = 'authenticated');
create policy "ratings: own write" on ratings for all using (user_id = auth.uid());

-- COMMENT REPORTS
create policy "comment_reports: mod insert" on comment_reports for insert with check (is_moderator() and reported_by = auth.uid());
create policy "comment_reports: mod read own" on comment_reports for select using (reported_by = auth.uid());
create policy "comment_reports: admin full" on comment_reports for all using (is_admin());

-- STUDY GUIDELINES
create policy "guidelines: student read published" on study_guidelines for select using (
    get_current_user_role() = 'student' and
    status = 'published' and
    department_id = (select department_id from profiles where id = auth.uid())
);
create policy "guidelines: mod read own dept" on study_guidelines for select using (is_moderator() and department_id = get_moderator_department());
create policy "guidelines: mod write own dept" on study_guidelines for all using (is_moderator() and department_id = get_moderator_department());
create policy "guidelines: admin full" on study_guidelines for all using (is_admin());

-- UPLOAD REQUESTS
create policy "upload_requests: student own" on upload_requests for all using (submitted_by = auth.uid());
create policy "upload_requests: mod read own dept" on upload_requests for select using (is_moderator() and department_id = get_moderator_department());
create policy "upload_requests: mod review" on upload_requests for update using (is_moderator() and department_id = get_moderator_department());
create policy "upload_requests: admin full" on upload_requests for all using (is_admin());

-- MODERATOR REQUESTS
create policy "mod_requests: own" on moderator_requests for all using (user_id = auth.uid());
create policy "mod_requests: admin full" on moderator_requests for all using (is_admin());

-- MODERATOR ASSIGNMENTS
create policy "mod_assignments: mod read own" on moderator_assignments for select using (user_id = auth.uid());
create policy "mod_assignments: admin full" on moderator_assignments for all using (is_admin());

-- NOTIFICATIONS
create policy "notifications: own only" on notifications for all using (user_id = auth.uid());

-- ACTIVITY LOGS
create policy "activity_logs: admin read" on activity_logs for select using (is_admin());

-- LOGIN LOGS
create policy "login_logs: own read" on login_logs for select using (user_id = auth.uid());
create policy "login_logs: admin read all" on login_logs for select using (is_admin());

-- ROLL NUMBER FORMATS
create policy "roll_formats: public read" on roll_number_formats for select using (true);
create policy "roll_formats: admin write" on roll_number_formats for all using (is_admin());
