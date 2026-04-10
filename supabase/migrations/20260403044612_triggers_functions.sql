-- Block 7A — Auto-create profile on new auth.users row
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, google_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'sub'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_auth_user();

-- Block 7B — Auto-update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
create trigger update_materials_updated_at before update on materials for each row execute procedure update_updated_at_column();
create trigger update_subjects_updated_at before update on subjects for each row execute procedure update_updated_at_column();
create trigger update_guidelines_updated_at before update on study_guidelines for each row execute procedure update_updated_at_column();
create trigger update_upload_requests_updated_at before update on upload_requests for each row execute procedure update_updated_at_column();
create trigger update_mod_requests_updated_at before update on moderator_requests for each row execute procedure update_updated_at_column();
create trigger update_departments_updated_at before update on departments for each row execute procedure update_updated_at_column();

-- Block 7C — Update material average_rating
create or replace function update_material_rating_cache()
returns trigger language plpgsql as $$
declare
  v_material_id uuid;
begin
  if (TG_OP = 'DELETE') then
    v_material_id := old.material_id;
  else
    v_material_id := new.material_id;
  end if;

  update materials
  set
    average_rating = (
      select round(avg(score)::numeric, 2) from ratings where material_id = v_material_id
    ),
    rating_count = (
      select count(*) from ratings where material_id = v_material_id
    )
  where id = v_material_id;

  return null;
end;
$$;

create trigger update_rating_cache_on_insert
  after insert on ratings for each row execute procedure update_material_rating_cache();
create trigger update_rating_cache_on_update
  after update on ratings for each row execute procedure update_material_rating_cache();
create trigger update_rating_cache_on_delete
  after delete on ratings for each row execute procedure update_material_rating_cache();

-- Block 7D — Update material full-text search vector
create or replace function update_material_search_vector()
returns trigger language plpgsql as $$
declare
  v_subject_name text;
  v_aliases      text;
  v_dept_name    text;
begin
  select s.name into v_subject_name from subjects s where s.id = new.subject_id;
  select string_agg(a.alias, ' ') into v_aliases
    from subject_aliases a where a.subject_id = new.subject_id;
  select d.name || ' ' || d.short_name into v_dept_name
    from departments d where d.id = new.department_id;

  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(v_subject_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(v_aliases, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(v_dept_name, '')), 'D');

  return new;
end;
$$;

create trigger update_material_search_vector_trigger
  before insert or update on materials
  for each row execute procedure update_material_search_vector();

-- Block 7E — Auto-upgrade student years
create or replace function upgrade_student_years()
returns void language plpgsql security definer as $$
begin
  update profiles set year = '4', updated_at = now()
  where year = '3' and role = 'student' and status = 'active';

  update profiles set year = '3', updated_at = now()
  where year = '2' and role = 'student' and status = 'active';

  update profiles set year = '2', updated_at = now()
  where year = '1' and role = 'student' and status = 'active';

  insert into activity_logs (action, entity_type, metadata)
  values ('year_upgrade', 'system', '{"triggered_by": "admin"}'::jsonb);
end;
$$;

-- Block 7F — Validate roll number format
create table roll_number_formats (
  id              uuid primary key default uuid_generate_v4(),
  department_id   uuid not null references departments(id),
  year            year_level not null,
  regex_pattern   text not null,
  example         text not null,
  unique (department_id, year)
);

insert into roll_number_formats (department_id, year, regex_pattern, example)
select d.id, '1', '^[0-9]{2}CSE[0-9]{3}$', '24CSE001' from departments d where d.short_name = 'CSE';
insert into roll_number_formats (department_id, year, regex_pattern, example)
select d.id, '2', '^[0-9]{2}CSE[0-9]{3}$', '23CSE001' from departments d where d.short_name = 'CSE';
insert into roll_number_formats (department_id, year, regex_pattern, example)
select d.id, '3', '^[0-9]{2}CSE[0-9]{3}$', '22CSE001' from departments d where d.short_name = 'CSE';
insert into roll_number_formats (department_id, year, regex_pattern, example)
select d.id, '4', '^[0-9]{2}CSE[0-9]{3}$', '21CSE001' from departments d where d.short_name = 'CSE';

-- Block 7G — Notification helper function
create or replace function create_notification(
  p_user_id   uuid,
  p_type      notification_type,
  p_title     text,
  p_body      text,
  p_metadata  jsonb default null
)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into notifications (user_id, type, title, body, metadata)
  values (p_user_id, p_type, p_title, p_body, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;
