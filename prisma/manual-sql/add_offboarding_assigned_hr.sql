-- Amendment: add assigned HR officer to offboarding cases.
-- (Supervisor reuses the existing supervisor_user_id column.)
-- Project has no prisma/migrations folder (schema-first), so this column is
-- applied manually and kept here as the record. Idempotent — safe to re-run.

ALTER TABLE offboarding_case
  ADD COLUMN IF NOT EXISTS assigned_hr_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_offboarding_case_assigned_hr'
  ) THEN
    ALTER TABLE offboarding_case
      ADD CONSTRAINT fk_offboarding_case_assigned_hr
      FOREIGN KEY (assigned_hr_id) REFERENCES users(user_id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
