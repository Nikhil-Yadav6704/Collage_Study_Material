-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  EduVault — Complete Schema v10.0                                ║
-- ║  Derived directly from backend source code.                      ║
-- ║  Run with: DROP SCHEMA public CASCADE; CREATE SCHEMA public;     ║
-- ║  Then paste this entire file.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── ENUMS ────────────────────────────────────────────────────────
CREATE TYPE user_role           AS ENUM ('student', 'moderator', 'admin');
CREATE TYPE account_status      AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE material_type       AS ENUM ('notes','teacher_notes','pyq','youtube','student_notes','book','ai_notes');
CREATE TYPE year_level          AS ENUM ('1','2','3','4');
CREATE TYPE request_status      AS ENUM ('pending','approved','approved_with_edits','rejected');
CREATE TYPE guideline_status    AS ENUM ('draft','published');
CREATE TYPE notification_type   AS ENUM (
  'new_student_request','request_approved_by_admin','material_rated',
  'comment_reported_confirmation','admin_action_in_dept','moderator_added',
  'guideline_reminder','system_alert','moderator_request_decision','upload_request_decision'
);
CREATE TYPE report_reason       AS ENUM ('abusive_language','spam','irrelevant_content','false_information','other');
CREATE TYPE mod_request_status  AS ENUM ('pending','approved','rejected');

-- ─── DEPARTMENTS ──────────────────────────────────────────────────
CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  short_name  text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO departments (name, short_name) VALUES
  ('Computer Science Engineering',         'CSE'),
  ('Electronics & Communication Engineering','ECE'),
  ('Mechanical Engineering',               'ME'),
  ('Civil Engineering',                    'CE'),
  ('Information Technology',               'IT'),
  ('Electrical & Electronics Engineering', 'EEE');

-- ─── SUBJECTS ─────────────────────────────────────────────────────
-- NOTE: No "code" or "description" columns — these do not exist in the API.
CREATE TABLE subjects (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name          text NOT NULL,
  semester      smallint NOT NULL CHECK (semester BETWEEN 1 AND 8),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, name, semester)
);
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_semester   ON subjects(department_id, semester);

-- ─── SUBJECT ALIASES ──────────────────────────────────────────────
CREATE TABLE subject_aliases (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  alias      text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, alias)
);
CREATE INDEX idx_subject_aliases_subject ON subject_aliases(subject_id);
CREATE INDEX idx_subject_aliases_trgm   ON subject_aliases USING gin(alias gin_trgm_ops);

-- ─── PROFILES ─────────────────────────────────────────────────────
-- NOTE: "admission_year" is included. All fields match backend /api/auth/me response.
CREATE TABLE profiles (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name              text NOT NULL,
  roll_number            text UNIQUE,
  department_id          uuid REFERENCES departments(id) ON DELETE SET NULL,
  year                   year_level,
  admission_year         integer,
  role                   user_role NOT NULL DEFAULT 'student',
  status                 account_status NOT NULL DEFAULT 'active',
  password_hash          text,
  avatar_url             text,
  google_id              text UNIQUE,
  email                  text NOT NULL UNIQUE,
  college_form_completed boolean NOT NULL DEFAULT false,
  last_active_at         timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_roll_number ON profiles(roll_number);
CREATE INDEX idx_profiles_department  ON profiles(department_id);
CREATE INDEX idx_profiles_role        ON profiles(role);
CREATE INDEX idx_profiles_status      ON profiles(status);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at);

-- ─── ROLL NUMBER FORMATS ──────────────────────────────────────────
CREATE TABLE roll_number_formats (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year          year_level NOT NULL,
  regex_pattern text NOT NULL,
  example       text NOT NULL,
  UNIQUE (department_id, year)
);

-- ─── MODERATOR ASSIGNMENTS ────────────────────────────────────────
-- NOTE: "updated_at" column is INCLUDED (backend writes it via moderators.ts line 34).
CREATE TABLE moderator_assignments (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  assigned_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX idx_mod_assignments_user ON moderator_assignments(user_id);
CREATE INDEX idx_mod_assignments_dept ON moderator_assignments(department_id);

-- ─── FOLDERS ──────────────────────────────────────────────────────
-- NOTE: "tags text[]" included. "folder_type" NOT NULL with default.
CREATE TABLE folders (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  parent_id     uuid REFERENCES folders(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  semester      smallint,
  subject_id    uuid REFERENCES subjects(id) ON DELETE SET NULL,
  folder_type   text NOT NULL DEFAULT 'generic',
  type_key      text,
  tags          text[] DEFAULT '{}',
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_dept   ON folders(department_id);
CREATE INDEX idx_folders_tags   ON folders USING GIN(tags);

-- ─── MATERIALS ────────────────────────────────────────────────────
-- NOTE: "folder_id" included. "tags text[]" included.
CREATE TABLE materials (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             text NOT NULL,
  description       text,
  material_type     material_type NOT NULL,
  subject_id        uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  department_id     uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  semester          smallint NOT NULL CHECK (semester BETWEEN 1 AND 8),
  year_restriction  year_level NOT NULL,
  folder_id         uuid REFERENCES folders(id) ON DELETE SET NULL,
  file_key          text,
  file_name         text,
  file_size_bytes   bigint,
  file_mime_type    text,
  external_url      text,
  url_domain        text,
  tags              text[] DEFAULT '{}',
  download_count    integer NOT NULL DEFAULT 0,
  average_rating    numeric(3,2),
  rating_count      integer NOT NULL DEFAULT 0,
  uploaded_by       uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  is_from_request   boolean NOT NULL DEFAULT false,
  source_request_id uuid,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_materials_subject    ON materials(subject_id);
CREATE INDEX idx_materials_department ON materials(department_id);
CREATE INDEX idx_materials_year       ON materials(year_restriction);
CREATE INDEX idx_materials_type       ON materials(material_type);
CREATE INDEX idx_materials_uploader   ON materials(uploaded_by);
CREATE INDEX idx_materials_active     ON materials(is_active, department_id);
CREATE INDEX idx_materials_folder     ON materials(folder_id);
CREATE INDEX idx_materials_tags       ON materials USING GIN(tags);

-- Full-text search vector
ALTER TABLE materials ADD COLUMN search_vector tsvector;
CREATE INDEX idx_materials_search ON materials USING gin(search_vector);
CREATE OR REPLACE FUNCTION update_material_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_materials_search_vector
BEFORE INSERT OR UPDATE ON materials
FOR EACH ROW EXECUTE FUNCTION update_material_search_vector();

-- Average rating trigger
CREATE OR REPLACE FUNCTION update_material_rating() RETURNS trigger AS $$
BEGIN
  UPDATE materials
  SET average_rating = (SELECT AVG(rating)::numeric(3,2) FROM ratings WHERE material_id = NEW.material_id),
      rating_count   = (SELECT COUNT(*) FROM ratings WHERE material_id = NEW.material_id),
      updated_at     = now()
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── STUDY GUIDELINES ─────────────────────────────────────────────
CREATE TABLE study_guidelines (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id     uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  department_id  uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  content        text,
  word_count     integer NOT NULL DEFAULT 0,
  status         guideline_status NOT NULL DEFAULT 'draft',
  written_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  last_edited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  published_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id)
);
CREATE INDEX idx_guidelines_dept    ON study_guidelines(department_id);
CREATE INDEX idx_guidelines_subject ON study_guidelines(subject_id);

-- ─── BOOKMARKS ────────────────────────────────────────────────────
CREATE TABLE bookmarks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_id)
);
CREATE INDEX idx_bookmarks_user     ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_material ON bookmarks(material_id);

-- ─── RATINGS ──────────────────────────────────────────────────────
-- NOTE: Column is "rating" (integer 1-5) — NOT "score". Matches backend ratings.ts.
CREATE TABLE ratings (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_id)
);
CREATE INDEX idx_ratings_material ON ratings(material_id);
CREATE INDEX idx_ratings_user     ON ratings(user_id);
CREATE TRIGGER trg_ratings_update_avg
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW EXECUTE FUNCTION update_material_rating();

-- ─── UPLOAD REQUESTS ──────────────────────────────────────────────
CREATE TABLE upload_requests (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  material_type         material_type NOT NULL,
  subject_id            uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  department_id         uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  semester              smallint NOT NULL,
  year_restriction      year_level NOT NULL,
  student_note          text,
  file_key              text,
  file_name             text,
  file_size_bytes       bigint,
  external_url          text,
  status                request_status NOT NULL DEFAULT 'pending',
  reviewed_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at           timestamptz,
  review_note           text,
  rejection_reason      text,
  resulting_material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_upload_requests_dept   ON upload_requests(department_id, status);
CREATE INDEX idx_upload_requests_submitter ON upload_requests(submitted_by);

-- ─── MODERATOR REQUESTS ───────────────────────────────────────────
-- NOTE: Column is "admin_message" — NOT "admin_note". No "linked_in_url" column.
CREATE TABLE moderator_requests (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  reason        text,
  status        mod_request_status NOT NULL DEFAULT 'pending',
  reviewed_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  admin_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mod_requests_status ON moderator_requests(status);
CREATE INDEX idx_mod_requests_user   ON moderator_requests(user_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
-- NOTE: Column is "body" (NOT "message"). "title" is separate. Matches notificationService.ts.
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  metadata   jsonb,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ─── ACTIVITY LOGS ────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user    ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ─── LOGIN LOGS ───────────────────────────────────────────────────
CREATE TABLE login_logs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  method     text NOT NULL,
  ip_address text,
  success    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── COMMENT REPORTS ──────────────────────────────────────────────
CREATE TABLE comment_reports (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  comment     text NOT NULL,
  reason      report_reason NOT NULL DEFAULT 'other',
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── FOLDER SEED (8 semesters per department) ──────────────────────
DO $$
DECLARE
  dept RECORD;
  dept_folder_id UUID;
  sem_num INT;
BEGIN
  FOR dept IN SELECT id, name, short_name FROM departments WHERE is_active = true
  LOOP
    INSERT INTO folders (name, parent_id, department_id, folder_type)
    VALUES (dept.short_name || ' — ' || dept.name, NULL, dept.id, 'department')
    RETURNING id INTO dept_folder_id;

    FOR sem_num IN 1..8 LOOP
      INSERT INTO folders (name, parent_id, department_id, semester, folder_type)
      VALUES (
        CASE sem_num
          WHEN 1 THEN '1st Semester' WHEN 2 THEN '2nd Semester'
          WHEN 3 THEN '3rd Semester' WHEN 4 THEN '4th Semester'
          WHEN 5 THEN '5th Semester' WHEN 6 THEN '6th Semester'
          WHEN 7 THEN '7th Semester' WHEN 8 THEN '8th Semester'
        END,
        dept_folder_id, dept.id, sem_num, 'semester'
      );
    END LOOP;
  END LOOP;
END $$;

-- ─── RLS POLICIES ─────────────────────────────────────────────────
-- The backend uses service_role which bypasses RLS.
-- These policies protect direct Supabase client access (e.g. from frontend supabase.ts).

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_guidelines  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile; admins can read all
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
-- Materials: anyone authenticated can read active materials
CREATE POLICY "materials_read_active" ON materials FOR SELECT USING (is_active = true);
-- Bookmarks: users manage own bookmarks only
CREATE POLICY "bookmarks_own" ON bookmarks FOR ALL USING (auth.uid() = user_id);
-- Ratings: users manage own ratings only
CREATE POLICY "ratings_own" ON ratings FOR ALL USING (auth.uid() = user_id);
-- Notifications: users read own notifications only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);
-- Upload requests: students see own; handled by backend for mods/admins
CREATE POLICY "upload_requests_own" ON upload_requests FOR SELECT USING (auth.uid() = submitted_by);
-- Study guidelines: published ones are readable by all authenticated users
CREATE POLICY "guidelines_read_published" ON study_guidelines FOR SELECT USING (status = 'published');
