-- 1. Add admission_year column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admission_year integer;

-- 2. Update existing folders table with missing columns
ALTER TABLE folders ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE folders ADD COLUMN IF NOT EXISTS folder_type text;

-- 3. Set defaults and constraints for folder_type
ALTER TABLE folders ALTER COLUMN folder_type SET DEFAULT 'generic';
-- Update existing rows to 'generic' so we can apply NOT NULL
UPDATE folders SET folder_type = 'generic' WHERE folder_type IS NULL;
ALTER TABLE folders ALTER COLUMN folder_type SET NOT NULL;

-- 4. Create indexes (using IF NOT EXISTS to prevent further errors)
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_dept ON folders(department_id);
CREATE INDEX IF NOT EXISTS idx_folders_tags ON folders USING GIN(tags);

-- 5. Seed folders for all departments (1-8 semesters)
DO $$
DECLARE
  dept RECORD;
  dept_folder_id UUID;
  sem_num INT;
BEGIN
  -- Loop through every active department found in your core tables
  FOR dept IN SELECT id, name, short_name FROM departments WHERE is_active = true
  LOOP
    -- Check if the top-level department folder already exists
    SELECT id INTO dept_folder_id FROM folders 
    WHERE department_id = dept.id AND parent_id IS NULL AND folder_type = 'department'
    LIMIT 1;

    -- Create the top-level department folder if it doesn't exist
    IF dept_folder_id IS NULL THEN
      INSERT INTO folders (name, parent_id, department_id, folder_type)
      VALUES (dept.short_name || ' — ' || dept.name, NULL, dept.id, 'department')
      RETURNING id INTO dept_folder_id;
    END IF;

    -- Create semesters 1-8 inside the department folder
    FOR sem_num IN 1..8
    LOOP
      -- Only insert if the semester folder doesn't already exist for this department
      IF NOT EXISTS (
        SELECT 1 FROM folders 
        WHERE department_id = dept.id 
        AND parent_id = dept_folder_id 
        AND semester = sem_num
      ) THEN
        INSERT INTO folders (
          name,
          parent_id,
          department_id,
          semester,
          folder_type
        )
        VALUES (
          CASE sem_num
            WHEN 1 THEN '1st Semester'
            WHEN 2 THEN '2nd Semester'
            WHEN 3 THEN '3rd Semester'
            WHEN 4 THEN '4th Semester'
            WHEN 5 THEN '5th Semester'
            WHEN 6 THEN '6th Semester'
            WHEN 7 THEN '7th Semester'
            WHEN 8 THEN '8th Semester'
          END,
          dept_folder_id,
          dept.id,
          sem_num,
          'semester'
        );
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Folder seeding complete.';
END $$;