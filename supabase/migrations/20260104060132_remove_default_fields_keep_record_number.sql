/*
  # Remove Default Fields Except Record Number

  1. Changes to records table
    - Remove: enquiry_officer, ob_number, offence, date_referred, case_short_of
    - Keep: id, user_id, record_number, created_at, updated_at
    - All other fields will be managed as custom_fields

  2. Security
    - All existing RLS policies remain intact
    - Custom fields provide the flexibility for field management
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'enquiry_officer'
  ) THEN
    ALTER TABLE records DROP COLUMN enquiry_officer;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'ob_number'
  ) THEN
    ALTER TABLE records DROP COLUMN ob_number;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'offence'
  ) THEN
    ALTER TABLE records DROP COLUMN offence;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'date_referred'
  ) THEN
    ALTER TABLE records DROP COLUMN date_referred;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'case_short_of'
  ) THEN
    ALTER TABLE records DROP COLUMN case_short_of;
  END IF;
END $$;
