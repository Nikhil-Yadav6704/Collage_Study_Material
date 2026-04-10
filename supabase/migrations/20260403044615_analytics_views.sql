-- View: materials per department count
create or replace view v_materials_per_department as
select
  d.short_name as department,
  d.name as department_name,
  count(m.id) filter (where m.is_active = true) as material_count
from departments d
left join materials m on m.department_id = d.id
group by d.id, d.short_name, d.name
order by material_count desc;

-- View: daily active users (last 30 days)
create or replace view v_daily_active_users as
select
  date_trunc('day', created_at) as day,
  count(distinct user_id) as active_users
from activity_logs
where created_at >= now() - interval '30 days'
group by 1 order by 1;

-- View: top rated materials (top 20)
create or replace view v_top_rated_materials as
select
  m.id,
  m.title,
  m.material_type,
  s.name as subject_name,
  d.short_name as department,
  m.average_rating,
  m.rating_count,
  m.download_count
from materials m
join subjects s on s.id = m.subject_id
join departments d on d.id = m.department_id
where m.is_active = true and m.rating_count >= 3
order by m.average_rating desc, m.rating_count desc
limit 20;

-- View: upload activity last 30 days
create or replace view v_upload_activity as
select
  date_trunc('day', created_at) as day,
  count(*) as uploads
from materials
where created_at >= now() - interval '30 days'
group by 1 order by 1;

-- View: peak usage hours
create or replace view v_peak_usage_hours as
select
  extract(hour from created_at) as hour,
  count(*) as actions
from activity_logs
where created_at >= now() - interval '30 days'
group by 1 order by 1;

-- View: pending moderation summary
create or replace view v_pending_summary as
select
  (select count(*) from upload_requests where status = 'pending') as pending_upload_requests,
  (select count(*) from moderator_requests where status = 'pending') as pending_moderator_requests,
  (select count(*) from comment_reports where is_resolved = false) as unresolved_reports;
