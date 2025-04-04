import { supabase, publicSupabase } from './supabase';

// Simple in-memory database using localStorage for demo purposes

export interface EmailSubscription {
  id?: string;
  email: string;
  timestamp?: number;
  source: string; // Where the email was collected from (e.g., 'hero', 'footer')
  created_at?: string;
}

export interface ForumPost {
  id?: string;
  name: string;
  email?: string;
  message: string;
  timestamp?: number;
  likes: number;
  created_at?: string;
}

export interface User {
  id?: string;
  email: string;
  password?: string; // Password field that can be null
  is_admin?: boolean;
  is_super_admin?: boolean;
  device?: string;
  country?: string;
  created_at?: string;
}

// Email subscriptions
export const saveEmail = async (email: string, source: string = 'hero'): Promise<EmailSubscription | null> => {
  try {
    // Check if email already exists in the database
    const { data: existingEmails } = await publicSupabase
      .from('emails')
      .select('*')
      .eq('email', email);

    // If it exists, return the existing record
    if (existingEmails && existingEmails.length > 0) {
      return existingEmails[0] as EmailSubscription;
    }

    // If it doesn't exist, insert it
    const { data, error } = await publicSupabase
      .from('emails')
      .insert([{ email, source }])
      .select()
      .single();

    if (error) {
      console.error('Error saving email:', error);
      return null;
    }

    return data as EmailSubscription;
  } catch (error) {
    console.error('Exception saving email:', error);
    return null;
  }
};

export const getEmails = async (): Promise<EmailSubscription[]> => {
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching emails:', error);
    return [];
  }

  return data || [];
};

// Forum posts
export const saveForumPost = async (name: string, email: string | null, message: string): Promise<ForumPost | null> => {
  try {
    // If there's an email, save it to the emails table with 'forum' source
    // This will not create a user account due to the trigger logic
    if (email) {
      await saveEmail(email, 'forum');
    }

    const { data, error } = await publicSupabase
      .from('forum_posts')
      .insert([{ name, email, message, likes: 0 }])
      .select()
      .single();

    if (error) {
      console.error('Error saving forum post:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception saving forum post:', error);
    return null;
  }
};

export const getForumPosts = async (): Promise<ForumPost[]> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching forum posts:', error);
    return [];
  }

  return data || [];
};

export const likeForumPost = async (id: string): Promise<ForumPost | null> => {
  // First get the current post to get the likes count
  const { data: post } = await supabase
    .from('forum_posts')
    .select('likes')
    .eq('id', id)
    .single();

  if (!post) return null;

  const { data, error } = await supabase
    .from('forum_posts')
    .update({ likes: post.likes + 1 })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error liking forum post:', error);
    return null;
  }

  return data;
};

// User management
// This function should only be called when a user explicitly requests access to the system
// (e.g. from the landing page form) - not from forum posts or other email collections
export const createUser = async (email: string, device?: string, country?: string): Promise<boolean> => {
  try {
    // Check if user already exists
    const { data: existingUsers } = await publicSupabase
      .from('users')
      .select('*')
      .eq('email', email);

    // If user doesn't exist, create one
    if (!existingUsers || existingUsers.length === 0) {
      const { error } = await publicSupabase
        .from('users')
        .insert([{ email, device, country }]);

      if (error) {
        console.error('Error creating user:', error);
        return false;
      }
    } else {
      // If user exists, update device and country if provided
      if (device || country) {
        const { error } = await publicSupabase
          .from('users')
          .update({ device, country })
          .eq('email', email);

        if (error) {
          console.error('Error updating user:', error);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Exception creating user:', error);
    return false;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error('Error fetching user:', error);
    }
    return null;
  }

  return data;
};

// Initialize sample data in Supabase
export const initializeSampleData = async () => {
  // Check if we already have forum posts
  const { count } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true });

  // Only seed if we have no posts
  if (count === 0) {
    const samplePosts = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        message: 'This clipboard manager is amazing! I use it every day for my work as a developer. The search feature is particularly useful when I need to find code snippets I copied earlier.',
        likes: 12
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        message: 'I love how I can quickly access my clipboard history. Would be great to have a way to organize items into folders or categories in a future update.',
        likes: 8
      },
      {
        name: 'Michael Chen',
        email: 'michael@example.com',
        message: 'The double-tap Tab shortcut is genius! So convenient. One suggestion: it would be nice to have keyboard shortcuts for navigating through clipboard items too.',
        likes: 5
      }
    ];

    const { error } = await supabase
      .from('forum_posts')
      .insert(samplePosts);

    if (error) {
      console.error('Error seeding forum posts:', error);
    }
  }
};

// Admin management functions
export const getAdminUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_admin', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching admin users:', error);
    return [];
  }
};

export const addAdminUser = async (email: string, isSuperAdmin: boolean = false): Promise<boolean> => {
  try {
    // First ensure the user exists
    await createUser(email);

    // Since createUser will either create a new admin user or update an existing one to be admin,
    // we just need to verify it worked
    const user = await getUserByEmail(email);
    return user?.is_admin === true;
  } catch (error) {
    console.error('Exception adding admin user:', error);
    return false;
  }
};

export const addSuperAdmin = async (email: string): Promise<boolean> => {
  try {
    // First ensure the user exists
    await createUser(email);

    // Since createUser will either create a new admin user or update an existing one to be admin,
    // we just need to verify it worked
    const user = await getUserByEmail(email);
    return user?.is_super_admin === true;
  } catch (error) {
    console.error('Exception adding super admin user:', error);
    return false;
  }
};

export const removeAdminPrivilege = async (email: string): Promise<boolean> => {
  try {
    // First check if this is the last super admin - don't allow removing
    if (await isLastSuperAdmin(email)) {
      console.error('Cannot remove the last super admin');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({ is_admin: false, is_super_admin: false })
      .eq('email', email);

    if (error) {
      console.error('Error removing admin privilege:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception removing admin privilege:', error);
    return false;
  }
};

// Helper function to check if the user is the last super admin
export const isLastSuperAdmin = async (email: string): Promise<boolean> => {
  try {
    // First check if the user is a super admin
    const user = await getUserByEmail(email);
    if (!user?.is_super_admin) {
      return false;
    }

    // Check how many super admins exist
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('is_super_admin', true);

    if (error) {
      console.error('Error checking super admin count:', error);
      return true; // Default to true to be safe
    }

    return data.length <= 1;
  } catch (error) {
    console.error('Exception checking super admin status:', error);
    return true; // Default to true to be safe
  }
};

// Add functions to verify password
export const verifyUserPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    // Get user with password
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('email', email)
      .single();

    if (error || !data || !data.password) {
      return false;
    }

    // Import bcrypt inside function to avoid issues with SSR
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, data.password);
  } catch (error) {
    console.error('Exception verifying password:', error);
    return false;
  }
};
