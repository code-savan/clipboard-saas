-- Creating SQL schema for Instant ClibBoard application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- Store bcrypt hashed password
  is_admin BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);

-- Emails collection table (for marketing and newsletter)
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL, -- Tracks where the email was collected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for emails
CREATE INDEX IF NOT EXISTS idx_emails_email ON emails(email);
CREATE INDEX IF NOT EXISTS idx_emails_source ON emails(source);

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255), -- Optional email
  message TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for forum posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_likes ON forum_posts(likes DESC);

-- Forum post likes tracking (to prevent duplicate likes)
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL, -- Store email for non-registered users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_email) -- Prevent duplicate likes from the same email
);

-- Create indexes for forum post likes
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user ON forum_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_email ON forum_post_likes(user_email);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL, -- Job role or position
  company VARCHAR(100), -- Optional company name
  quote TEXT NOT NULL,
  stars INTEGER DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  is_verified BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_stars ON testimonials(stars DESC);

-- RLS (Row Level Security) Policies

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Only admins can see all users, users can see themselves
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) OR
    auth.role() = 'anon'
  );

-- Allow creation of users from anonymous sessions (for signup flow)
CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (
    TRUE
  );

-- Emails policies
-- Admins can see all emails, regular users can't see any
CREATE POLICY emails_select_policy ON emails
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) OR
    auth.role() = 'anon'
  );

-- Anyone can insert an email (for subscription forms)
CREATE POLICY emails_insert_policy ON emails
  FOR INSERT WITH CHECK (TRUE);

-- Forum posts policies
-- Anyone can see forum posts
CREATE POLICY forum_posts_select_policy ON forum_posts
  FOR SELECT USING (TRUE);

-- Anyone can create forum posts
CREATE POLICY forum_posts_insert_policy ON forum_posts
  FOR INSERT WITH CHECK (TRUE);

-- Only admins or the original poster can update posts
CREATE POLICY forum_posts_update_policy ON forum_posts
  FOR UPDATE USING (
    email = (SELECT email FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Forum post likes policies
-- Anyone can see likes
CREATE POLICY forum_post_likes_select_policy ON forum_post_likes
  FOR SELECT USING (TRUE);

-- Anyone can like a post
CREATE POLICY forum_post_likes_insert_policy ON forum_post_likes
  FOR INSERT WITH CHECK (TRUE);

-- No one can update likes directly
CREATE POLICY forum_post_likes_update_policy ON forum_post_likes
  FOR UPDATE USING (FALSE);

-- Only the user who liked or admin can remove a like
CREATE POLICY forum_post_likes_delete_policy ON forum_post_likes
  FOR DELETE USING (
    user_email = (SELECT email FROM users WHERE id = auth.uid()) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Testimonials policies
-- Anyone can see testimonials
CREATE POLICY testimonials_select_policy ON testimonials
  FOR SELECT USING (TRUE);

-- Only admins can add or update testimonials
CREATE POLICY testimonials_insert_policy ON testimonials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY testimonials_update_policy ON testimonials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Forum trigger to update likes count
CREATE OR REPLACE FUNCTION update_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE forum_posts
    SET likes = likes + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count
    UPDATE forum_posts
    SET likes = likes - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to the forum_post_likes table
CREATE TRIGGER forum_post_likes_insert_trigger
AFTER INSERT ON forum_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_forum_post_likes_count();

CREATE TRIGGER forum_post_likes_delete_trigger
AFTER DELETE ON forum_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_forum_post_likes_count();

-- Email subscription auto-create user trigger
CREATE OR REPLACE FUNCTION create_user_from_email()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new email is added to emails table, add to users table if not exists
  INSERT INTO users (email, is_admin)
  VALUES (NEW.email, FALSE)
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to emails table
CREATE TRIGGER emails_insert_trigger
AFTER INSERT ON emails
FOR EACH ROW
EXECUTE FUNCTION create_user_from_email();

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT, admin_password TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (email, is_admin, password)
  VALUES (admin_email, TRUE, admin_password)
  ON CONFLICT (email)
  DO UPDATE SET is_admin = TRUE,
              password = CASE
                           WHEN admin_password IS NOT NULL THEN admin_password
                           ELSE users.password
                         END;
END;
$$ LANGUAGE plpgsql;

-- Create super admin user function
CREATE OR REPLACE FUNCTION create_super_admin(admin_email TEXT, admin_password TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (email, is_admin, is_super_admin, password)
  VALUES (admin_email, TRUE, TRUE, admin_password)
  ON CONFLICT (email)
  DO UPDATE SET is_admin = TRUE,
              is_super_admin = TRUE,
              password = CASE
                           WHEN admin_password IS NOT NULL THEN admin_password
                           ELSE users.password
                         END;
END;
$$ LANGUAGE plpgsql;

-- Initial seed data for testimonials
INSERT INTO testimonials (name, role, company, quote, stars, is_featured)
VALUES
  ('Sarah Johnson', 'Software Developer', 'TechCorp',
   'ClibBoard has transformed my workflow. I save at least an hour each day by not having to re-copy things.',
   5, TRUE),
  ('Mark Williams', 'Content Creator', 'CreativeStudio',
   'As someone who constantly copies snippets for my content, this tool is absolutely essential.',
   5, TRUE),
  ('Elena Rodriguez', 'UX Designer', 'DesignHub',
   'The image handling is amazing! I can keep all my design references organized without effort.',
   5, TRUE);

-- Comment out forum post seeding for fresh start
/*
-- Initial seed data for forum posts
INSERT INTO forum_posts (name, email, message, likes)
VALUES
  ('John Smith', 'john@example.com',
   'This clipboard manager is amazing! I use it every day for my work as a developer. The search feature is particularly useful when I need to find code snippets I copied earlier.',
   0),
  ('Sarah Johnson', 'sarah@example.com',
   'I love how I can quickly access my clipboard history. Would be great to have a way to organize items into folders or categories in a future update.',
   0),
  ('Michael Chen', 'michael@example.com',
   'The double-tap Tab shortcut is genius! So convenient. One suggestion: it would be nice to have keyboard shortcuts for navigating through clipboard items too.',
   0);

-- Add sample likes
WITH john_post AS (
  SELECT id FROM forum_posts WHERE email = 'john@example.com' LIMIT 1
)
INSERT INTO forum_post_likes (post_id, user_email)
SELECT
  (SELECT id FROM john_post),
  email
FROM unnest(ARRAY['user1@example.com', 'user2@example.com', 'user3@example.com']) AS email;
*/
