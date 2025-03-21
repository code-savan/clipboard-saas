// TypeScript database type definitions for Instant ClibBoard app

export type User = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Admin = {
  id: string;
  email: string;
  password: string; // This will be hashed - never expose directly
  is_super: boolean;
  created_at: string;
  updated_at: string;
};

export type Email = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

export type ForumPost = {
  id: string;
  name: string;
  email?: string;
  message: string;
  likes: number;
  created_at: string;
  updated_at: string;
};

export type ForumPostLike = {
  id: string;
  post_id: string;
  user_id?: string;
  user_email: string;
  created_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company?: string;
  quote: string;
  stars: number;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

// Database schema type definition for use with Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      admins: {
        Row: Admin;
        Insert: Omit<Admin, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Admin, 'id' | 'created_at' | 'updated_at'>>;
      };
      emails: {
        Row: Email;
        Insert: Omit<Email, 'id' | 'created_at'>;
        Update: Partial<Omit<Email, 'id' | 'created_at'>>;
      };
      forum_posts: {
        Row: ForumPost;
        Insert: Omit<ForumPost, 'id' | 'likes' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ForumPost, 'id' | 'created_at' | 'updated_at'>>;
      };
      forum_post_likes: {
        Row: ForumPostLike;
        Insert: Omit<ForumPostLike, 'id' | 'created_at'>;
        Update: Partial<Omit<ForumPostLike, 'id' | 'created_at'>>;
      };
      testimonials: {
        Row: Testimonial;
        Insert: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Functions: {
      create_admin: {
        Args: {
          admin_email: string;
          admin_password: string;
          is_super_admin?: boolean;
        };
        Returns: string;
      };
      is_admin: {
        Args: {
          user_email: string;
        };
        Returns: boolean;
      };
      is_super_admin: {
        Args: {
          user_email: string;
        };
        Returns: boolean;
      };
      update_forum_post_likes_count: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
  };
};
