-- Run in Supabase SQL Editor
-- This table stores the folder hierarchy created by admins

CREATE TABLE IF NOT EXISTS folders (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  parent_id     uuid REFERENCES folders(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  semester      smallint,          -- NULL for dept-level folders
  subject_id    uuid REFERENCES subjects(id) ON DELETE CASCADE,  -- NULL unless subject-level
  folder_type   text,              -- 'department' | 'semester' | 'subject' | 'type'
  type_key      text,              -- 'notes' | 'pyq' | 'youtube' etc (for type-level folders)
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_dept ON folders(department_id);

-- Also add folder_id to materials table so files can be placed in folders
ALTER TABLE materials ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
