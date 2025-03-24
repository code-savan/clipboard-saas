-- Creating SQL schema for Instant ClibBoard application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (no admin fields)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Admins table (separate from users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Store bcrypt hashed password
  is_super BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admins
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_super ON admins(is_super);

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

-- Admin creation function
CREATE OR REPLACE FUNCTION create_admin(admin_email TEXT, admin_password TEXT, is_super_admin BOOLEAN DEFAULT FALSE)
RETURNS UUID AS $$
DECLARE
  admin_id UUID;
BEGIN
  INSERT INTO admins (email, password, is_super)
  VALUES (admin_email, admin_password, is_super_admin)
  ON CONFLICT (email)
  DO UPDATE SET password = admin_password,
                is_super = is_super_admin
  RETURNING id INTO admin_id;

  RETURN admin_id;
END;
$$ LANGUAGE plpgsql;

-- Check if user is admin function
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE email = user_email);
END;
$$ LANGUAGE plpgsql;

-- Check if user is super admin function
CREATE OR REPLACE FUNCTION is_super_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE email = user_email AND is_super = TRUE);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Set permissive policies for all operations on all tables

-- Users table policies
CREATE POLICY users_all_policy ON users FOR ALL USING (TRUE);

-- Admins table policies
CREATE POLICY admins_all_policy ON admins FOR ALL USING (TRUE);

-- Emails table policies
CREATE POLICY emails_all_policy ON emails FOR ALL USING (TRUE);

-- Forum posts table policies
CREATE POLICY forum_posts_all_policy ON forum_posts FOR ALL USING (TRUE);

-- Forum post likes table policies
CREATE POLICY forum_post_likes_all_policy ON forum_post_likes FOR ALL USING (TRUE);

-- Testimonials table policies
CREATE POLICY testimonials_all_policy ON testimonials FOR ALL USING (TRUE);

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

-- Email subscription auto-create user trigger
CREATE OR REPLACE FUNCTION create_user_from_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create users for emails from specific sources (landing page)
  -- Do not create users for forum posts or other sources
  IF NEW.source IN ('hero', 'footer', 'login') THEN
    INSERT INTO users (email)
    VALUES (NEW.email)
    ON CONFLICT (email) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to emails table
CREATE TRIGGER emails_insert_trigger
AFTER INSERT ON emails
FOR EACH ROW
EXECUTE FUNCTION create_user_from_email();
