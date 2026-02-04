/*
  # Fix infinite recursion in profiles RLS policies

  The previous policy caused infinite recursion when checking admin status
  by querying the profiles table from within a profiles table policy.

  ## Changes
  - Remove recursive admin policy from profiles table
  - Simplify to use function-based admin check to avoid infinite recursion
*/

-- Drop all existing policies on profiles table
DO $$ 
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can read own profile" ON profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON profiles';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create function to check if user is admin (without triggering infinite recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);