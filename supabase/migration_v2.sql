-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Update Classes Table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS section text;
-- Ideally we might want a unique constraint on (school_id, name, section), but for now let's just add the column.

-- 2. Update Students Table
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS contact_no text;

-- 3. Policy Update (Confirmation only, existing policies on 'all' usually cover new columns if using wildcard)
-- No changes needed if we used "for all" and generic RLS.
