/*
  # Office Records Management System Schema

  ## Overview
  This migration sets up the complete database structure for an office records management system
  with role-based access control, dynamic field management, and user-specific record tracking.

  ## New Tables

  ### 1. profiles
  Extends auth.users with additional user information:
  - `id` (uuid, primary key) - References auth.users.id
  - `username` (text, unique) - User's chosen username
  - `email` (text) - User's email address
  - `role` (text) - Either 'admin' or 'user', defaults to 'user'
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. records
  Stores the main office records with default fields:
  - `id` (uuid, primary key) - Unique record identifier
  - `user_id` (uuid) - References profiles.id, owner of the record
  - `record_number` (integer) - Auto-incrementing record number per user
  - `enquiry_officer` (text) - Name of the enquiry officer
  - `ob_number` (text) - OB reference number
  - `offence` (text) - Type of offence
  - `date_referred` (date) - Date the case was referred
  - `case_short_of` (text) - Case short description/status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. custom_fields
  Stores additional fields that admins can add to the records table:
  - `id` (uuid, primary key) - Unique field identifier
  - `field_name` (text, unique) - Name of the custom field
  - `field_type` (text) - Data type: 'text', 'number', 'date'
  - `created_by` (uuid) - References profiles.id, admin who created it
  - `created_at` (timestamptz) - Field creation timestamp

  ### 4. custom_field_values
  Stores values for custom fields for each record:
  - `id` (uuid, primary key) - Unique value identifier
  - `record_id` (uuid) - References records.id
  - `field_id` (uuid) - References custom_fields.id
  - `value` (text) - The actual value stored as text
  - `created_at` (timestamptz) - Value creation timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:

  #### profiles table:
  - Users can read their own profile
  - Admins can read all profiles
  - Users can update their own profile (except role)
  - New users can insert their own profile during registration

  #### records table:
  - Users can read only their own records
  - Admins can read all records
  - Users can insert their own records
  - Users can update their own records
  - Users can delete their own records
  - Admins can delete any record

  #### custom_fields table:
  - Everyone (authenticated) can read custom fields
  - Only admins can insert custom fields
  - Only admins can delete custom fields

  #### custom_field_values table:
  - Users can read values for their own records
  - Admins can read all values
  - Users can insert values for their own records
  - Users can update values for their own records
  - Users can delete values for their own records
  - Admins can delete any values

  ## Notes
  - The record_number is automatically incremented per user using a sequence
  - All timestamps use UTC timezone
  - Custom field values are stored as text and cast as needed
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create records table
CREATE TABLE IF NOT EXISTS records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  record_number integer NOT NULL,
  enquiry_officer text,
  ob_number text,
  offence text,
  date_referred date,
  case_short_of text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, record_number)
);

ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text UNIQUE NOT NULL,
  field_type text NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'number', 'date')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

-- Create custom_field_values table
CREATE TABLE IF NOT EXISTS custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(record_id, field_id)
);

ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS Policies for records table
CREATE POLICY "Users can read own records"
  ON records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all records"
  ON records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own records"
  ON records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records"
  ON records FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own records"
  ON records FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any record"
  ON records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for custom_fields table
CREATE POLICY "Everyone can read custom fields"
  ON custom_fields FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert custom fields"
  ON custom_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete custom fields"
  ON custom_fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for custom_field_values table
CREATE POLICY "Users can read own record values"
  ON custom_field_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = custom_field_values.record_id
      AND records.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all values"
  ON custom_field_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert values for own records"
  ON custom_field_values FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = custom_field_values.record_id
      AND records.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update values for own records"
  ON custom_field_values FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = custom_field_values.record_id
      AND records.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = custom_field_values.record_id
      AND records.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete values for own records"
  ON custom_field_values FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM records
      WHERE records.id = custom_field_values.record_id
      AND records.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete any values"
  ON custom_field_values FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to auto-increment record_number per user
CREATE OR REPLACE FUNCTION set_record_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.record_number IS NULL THEN
    SELECT COALESCE(MAX(record_number), 0) + 1
    INTO NEW.record_number
    FROM records
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set record_number
CREATE TRIGGER set_record_number_trigger
  BEFORE INSERT ON records
  FOR EACH ROW
  EXECUTE FUNCTION set_record_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();