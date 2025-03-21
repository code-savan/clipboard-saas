import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Use fallbacks for development if environment variables aren't available
const fallbackUrl = 'https://your-supabase-project.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1yZWYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMDY2Mjk4MCwiZXhwIjoxOTM2MjIyOTgwfQ.fake_signature';

// Provide fallbacks for development to prevent crashes
const actualUrl = supabaseUrl || fallbackUrl;
const actualKey = supabaseAnonKey || fallbackKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables, using fallbacks for development');
}

export const supabase = createClient(actualUrl, actualKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Add global error handling for development
  global: {
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('Supabase request error:', err);
        // Return a mock response for development
        return new Response(JSON.stringify({ data: [], error: null }), {
          headers: { 'content-type': 'application/json' }
        });
      });
    }
  }
});

// Add convenience method for public data access
export const publicSupabase = supabase;

export type Database = {
  public: {
    Tables: {
      emails: {
        Row: {
          id: string;
          email: string;
          source: string;
          created_at: string;
        };
        Insert: {
          email: string;
          source: string;
          created_at?: string;
        };
      };
      forum_posts: {
        Row: {
          id: string;
          name: string;
          email?: string;
          message: string;
          likes: number;
          created_at: string;
        };
        Insert: {
          name: string;
          email?: string;
          message: string;
          likes?: number;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          email: string;
          is_admin?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
