/*
  # Add Admin Record Management Policies

  Allows admins to create, edit, and manage records for any user.

  ## Changes
  - Add policy for admins to insert records assigned to any user
  - Add policy for admins to update any record (including user_id reassignment)
*/

CREATE POLICY "Admins can insert any records"
  ON records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any records"
  ON records FOR UPDATE
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