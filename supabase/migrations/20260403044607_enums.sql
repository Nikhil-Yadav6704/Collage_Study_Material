-- User role
create type user_role as enum ('student', 'moderator', 'admin');

-- Account status
create type account_status as enum ('active', 'suspended', 'banned');

-- Material types
create type material_type as enum (
  'notes',
  'teacher_notes',
  'pyq',
  'youtube',
  'student_notes',
  'book',
  'ai_notes'
);

-- Year restriction
create type year_level as enum ('1', '2', '3', '4');

-- Upload request status
create type request_status as enum ('pending', 'approved', 'approved_with_edits', 'rejected');

-- Guideline publish status
create type guideline_status as enum ('draft', 'published');

-- Notification types
create type notification_type as enum (
  'new_student_request',
  'request_approved_by_admin',
  'material_rated',
  'comment_reported_confirmation',
  'admin_action_in_dept',
  'moderator_added',
  'guideline_reminder',
  'system_alert',
  'moderator_request_decision',
  'upload_request_decision'
);

-- Comment report reasons
create type report_reason as enum (
  'abusive_language',
  'spam',
  'irrelevant_content',
  'false_information',
  'other'
);

-- Moderator request status
create type moderator_request_status as enum ('pending', 'approved', 'rejected');
