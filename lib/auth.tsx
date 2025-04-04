'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getUserByEmail, saveEmail, createUser } from './db';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session && !user && session.user.email) {
        try {
          // Save email to database for marketing, but don't create user
          try {
            await saveEmail(session.user.email, 'auth');
          } catch (emailError) {
            console.warn('Failed to save email during session init:', emailError);
          }

          // Fetch user details if they exist
          const userDetails = await getUserByEmail(session.user.email);

          // Update state with session details
          setUser(session.user);
          setIsAdmin(userDetails?.is_admin || false);
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Save email to emails table for marketing
          if (session.user.email) {
            // Only save on sign in or token refresh events
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              try {
                await saveEmail(session.user.email, 'login');
              } catch (error) {
                console.error('Error saving email during auth state change:', error);
              }
            }
          }

          try {
            const userDetails = await getUserByEmail(session.user.email!);
            setIsAdmin(userDetails?.is_admin ?? false);
          } catch (error) {
            console.error('Error getting user details:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }

        setLoading(false);
      }
    );

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isAdmin,
    signIn: async (email: string, password: string) => {
      try {
        const result = await supabase.auth.signInWithPassword({ email, password });

        // If sign-in is successful, save the email to emails table for marketing
        if (result.data?.user) {
          try {
            await saveEmail(email, 'signin');
            // Don't create a user here, as they should already exist if they're signing in

            // Check if user is admin after sign-in
            const userDetails = await getUserByEmail(email);
            if (userDetails) {
              return {
                ...result,
                isAdmin: userDetails.is_admin
              };
            }
          } catch (error) {
            console.error('Error saving email after signin:', error);
            // Continue anyway since sign-in succeeded
          }
        }

        return result;
      } catch (error) {
        console.error('Error during sign in:', error);
        return {
          error: { message: 'Authentication failed. Please try again.' },
          data: null
        };
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const result = await supabase.auth.signUp({ email, password });

        // If sign-up is successful, create a user account (this is the explicit request for access)
        if (result.data?.user) {
          try {
            // Save email for marketing
            await saveEmail(email, 'signup');

            // Get device information
            const device = navigator.userAgent;

            // Try to get country information using a simple IP-based API
            let country = '';
            try {
              const response = await fetch('https://ipapi.co/json/');
              const data = await response.json();
              country = data.country_name || '';
            } catch (err) {
              console.warn('Could not get country information:', err);
            }

            // Create user - this is only place we should create users since signUp
            // represents an explicit request for access
            await createUser(email, device, country);
          } catch (error) {
            console.error('Error saving user data after signup:', error);
            // Continue anyway since sign-up succeeded
          }
        }

        return result;
      } catch (error) {
        console.error('Error during sign up:', error);
        return {
          error: { message: 'Registration failed. Please try again.' },
          data: null
        };
      }
    },
    signOut: () => supabase.auth.signOut(),
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
