/*
  # Add Field Ordering Support

  1. Changes to custom_fields table
    - Add `position` column to allow admin field reordering
    - Position defaults to created_at timestamp for sorting

  2. Notes
    - Admins can now drag and reorder custom fields
    - Position is used for field display order in forms and lists
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_fields' AND column_name = 'position'
  ) THEN
    ALTER TABLE custom_fields ADD COLUMN position integer DEFAULT 0;
  END IF;
END $$;
