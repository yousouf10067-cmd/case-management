/*
  # Add Admin Policies for Custom Field Values

  ## Problem
  When admins edit records belonging to other users, the custom field values are deleted but cannot be re-inserted due to missing RLS policies. Admins can delete values but cannot insert or update them.

  ## Solution
  Add two new RLS policies:
  1. Allow admins to insert values for any record (including those belonging to other users)
  2. Allow admins to update values for any record (including those belonging to other users)

  ## Security
  - Only authenticated admins can use these policies
  - Values must still belong to a valid record via foreign key constraint
*/

CREATE POLICY "Admins can insert values for any record"
  ON custom_field_values FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update values for any record"
  ON custom_field_values FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
