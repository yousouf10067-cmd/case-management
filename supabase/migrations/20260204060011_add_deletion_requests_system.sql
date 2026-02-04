/*
  # Add Deletion Request System
  
  ## Problem
  Users should not be able to delete records directly. Instead, they submit deletion requests that admins can review and approve.
  
  ## Solution
  Create a new `deletion_requests` table to track user deletion requests with status tracking.
  
  ## New Tables
  - `deletion_requests`
    - `id` (uuid, primary key)
    - `record_id` (uuid) - References records.id
    - `user_id` (uuid) - User who requested deletion
    - `reason` (text) - Optional reason for deletion request
    - `status` (text) - 'pending', 'approved', 'rejected'
    - `created_at` (timestamptz)
    - `reviewed_at` (timestamptz) - When admin reviewed
    - `reviewed_by` (uuid) - Admin who reviewed it
  
  ## Security
  - Enable RLS on deletion_requests table
  - Users can create requests for their own records
  - Users can view their own requests
  - Admins can view and update all requests
  - Users cannot delete directly; only through deletion requests
*/

CREATE TABLE IF NOT EXISTS deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests"
  ON deletion_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all deletion requests"
  ON deletion_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create deletion requests for own records"
  ON deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = record_id AND records.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update deletion requests"
  ON deletion_requests FOR UPDATE
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

CREATE POLICY "Users cannot delete deletion requests"
  ON deletion_requests FOR DELETE
  TO authenticated
  USING (false);

CREATE INDEX deletion_requests_status_idx ON deletion_requests(status);
CREATE INDEX deletion_requests_record_id_idx ON deletion_requests(record_id);
CREATE INDEX deletion_requests_user_id_idx ON deletion_requests(user_id);