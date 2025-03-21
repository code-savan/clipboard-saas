-- Admin Table Setup for Instant ClipBoard

-- 1. First ensure UUID extension is enabled (already done in main schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure users table exists with admin field
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE, -- Adding super admin distinction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index on email for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);

-- 4. Create admin management functions
-- Function to add a new admin user
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (email, is_admin)
  VALUES (admin_email, TRUE)
  ON CONFLICT (email)
  DO UPDATE SET is_admin = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to create a super admin user
CREATE OR REPLACE FUNCTION create_super_admin(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (email, is_admin, is_super_admin)
  VALUES (admin_email, TRUE, TRUE)
  ON CONFLICT (email)
  DO UPDATE SET is_admin = TRUE, is_super_admin = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke admin privileges
CREATE OR REPLACE FUNCTION revoke_admin_privileges(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET is_admin = FALSE, is_super_admin = FALSE
  WHERE email = admin_email AND NOT (SELECT EXISTS(
    -- Prevent revoking the last super admin
    SELECT 1 FROM users
    WHERE is_super_admin = TRUE AND email != admin_email
  ));
END;
$$ LANGUAGE plpgsql;

-- 5. Add RLS policies for admin users
-- Update the existing users policies if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin users can see all users
CREATE POLICY IF NOT EXISTS admin_users_select_policy ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Only super admins can create other admins
CREATE POLICY IF NOT EXISTS super_admin_users_update_policy ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

-- 6. Create a trigger to prevent removing the last super admin
CREATE OR REPLACE FUNCTION prevent_last_super_admin_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_super_admin = TRUE AND
     (SELECT COUNT(*) FROM users WHERE is_super_admin = TRUE) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last super admin user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_last_super_admin_trigger
BEFORE UPDATE OR DELETE ON users
FOR EACH ROW
WHEN (OLD.is_super_admin = TRUE)
EXECUTE FUNCTION prevent_last_super_admin_removal();

-- 7. Example command to create your first super admin (REPLACE WITH YOUR EMAIL)
-- SELECT create_super_admin('your-email@example.com');

-- Note: Run this manually after executing the script:
-- SELECT create_super_admin('admin@yourcompany.com');
