'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Define hardcoded admin credentials for development
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

export default function AdminLogin() {
  const [email, setEmail] = useState(ADMIN_CREDENTIALS.email);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [noAdminUsers, setNoAdminUsers] = useState(false);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check if any admin users exist
  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const { data: admins, error } = await supabase
          .from('admins')
          .select('id');

        if (error) {
          console.error('Error checking admin users:', error);
          return;
        }

        setNoAdminUsers(admins.length === 0);
      } catch (error) {
        console.error('Error checking admin users:', error);
      } finally {
        setCheckingAdmins(false);
      }
    };

    checkAdmins();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For development: check hardcoded admin credentials first
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        console.log('Using hardcoded admin credentials for development');

        // Create admin in database if it doesn't exist
        try {
          // Hash the password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

          // Check if the admin exists
          const { data: existingAdmin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', ADMIN_CREDENTIALS.email)
            .single();

          if (!existingAdmin) {
            // Create the admin
            await supabase
              .from('admins')
              .insert([{
                email: ADMIN_CREDENTIALS.email,
                password: hashedPassword,
                is_super: true
              }]);
          }
        } catch (adminError) {
          console.warn('Error creating admin user:', adminError);
        }

        // Store admin auth in localStorage for client-side checks
        localStorage.setItem('admin_auth', JSON.stringify({
          email: ADMIN_CREDENTIALS.email,
          isAdmin: true,
          isSuperAdmin: true,
          timestamp: Date.now()
        }));

        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard (Development mode)",
        });

        router.push('/admin');
        return;
      }

      // Database authentication for real admins
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .single();

      if (adminError || !admin) {
        toast({
          title: "Login failed",
          description: "Admin account not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (isValidPassword) {
        // Set local auth for client-side checks
        localStorage.setItem('admin_auth', JSON.stringify({
          email: email,
          isAdmin: true,
          isSuperAdmin: admin.is_super || false,
          timestamp: Date.now()
        }));

        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        router.push('/admin');
      } else {
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Login to access the Instant ClipBoard admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={ADMIN_CREDENTIALS.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-3 rounded-md text-sm flex items-center">
              <Info className="h-4 w-4 mr-2" />
              For development: Use email <strong>{ADMIN_CREDENTIALS.email}</strong> and password <strong>{ADMIN_CREDENTIALS.password}</strong>
            </div> */}

            {noAdminUsers && !checkingAdmins && (
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3 rounded-md text-sm flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                No admin users found. <Link href="/admin/setup" className="ml-1 underline font-medium">Set up the first admin account</Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
