/*
  # Set initial admin user

  Sets yousouf1984@gmail.com as an admin user when they register.
  This migration creates a trigger that automatically assigns admin role
  to this specific email address.
*/

CREATE OR REPLACE FUNCTION set_admin_for_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'yousouf1984@gmail.com' THEN
    UPDATE profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_trigger ON profiles;

CREATE TRIGGER set_admin_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_for_email();