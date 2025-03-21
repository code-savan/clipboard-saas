-- SQL script to completely wipe the database
-- WARNING: This will delete all data!

-- Drop all tables
DROP TABLE IF EXISTS forum_post_likes CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_forum_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS create_user_from_email() CASCADE;
DROP FUNCTION IF EXISTS create_admin(TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS is_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_super_admin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS revoke_admin_privileges(TEXT) CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS forum_post_likes_insert_trigger ON forum_post_likes CASCADE;
DROP TRIGGER IF EXISTS forum_post_likes_delete_trigger ON forum_post_likes CASCADE;
DROP TRIGGER IF EXISTS emails_insert_trigger ON emails CASCADE;

-- Reset all sequences
DO $$
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN (SELECT c.relname FROM pg_class c WHERE c.relkind = 'S')
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1;';
    END LOOP;
END $$;

-- Revoke all privileges granted to roles
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, service_role;

-- Disable RLS on any tables that might still exist
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE ' || t_name || ' DISABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- Drop any remaining policies
DO $$
DECLARE
   pol_record record;
BEGIN
   FOR pol_record IN (
      SELECT policyname, tablename
      FROM pg_policies
      WHERE schemaname = 'public'
   ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I',
                    pol_record.policyname,
                    pol_record.tablename);
   END LOOP;
END $$;

-- Remove any remaining extensions
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Vacuum the database to reclaim space
VACUUM FULL;
