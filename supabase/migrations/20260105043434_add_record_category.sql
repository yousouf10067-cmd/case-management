/*
  # Add Record Category

  1. Changes to records table
    - Add `category` column to categorize records as "CASE OB" or "PHQ"
    - Defaults to "CASE OB"

  2. Purpose
    - Allows records to be displayed in two separate sections
    - Supports future expansion for additional categories
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'category'
  ) THEN
    ALTER TABLE records ADD COLUMN category text DEFAULT 'CASE OB';
  END IF;
END $$;
