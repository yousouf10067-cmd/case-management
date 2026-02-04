/*
  # Add record notification tracking

  Adds a column to track when records were last viewed by users so we can
  detect new or updated records for notification purposes.

  ## Changes
  - Add `last_viewed_at` column to records table to track last time user viewed their records
  - Admin updates set this to current timestamp
  - Users see notifications for records updated after their last login
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'last_viewed_at'
  ) THEN
    ALTER TABLE records ADD COLUMN last_viewed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login timestamptz;
  END IF;
END $$;