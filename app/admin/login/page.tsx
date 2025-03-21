'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createUser, saveEmail, getUserByEmail, getAdminUsers } from '@/lib/db';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [noAdminUsers, setNoAdminUsers] = useState(false);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const { signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Check if any admin users exist
  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const admins = await getAdminUsers();
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
      // Try to sign in with Supabase auth
      const { error, data } = await signIn(email, password);

      if (error) {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      } else {
        // Check if the user is an admin
        const userDetails = await getUserByEmail(email);

        if (userDetails?.is_admin) {
          toast({
            title: "Login successful",
            description: "Welcome to the admin dashboard",
          });
          router.push('/admin');
        } else {
          // User exists but is not an admin
          toast({
            title: "Access denied",
            description: "Your account does not have admin privileges",
            variant: "destructive",
          });
        }
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
                placeholder="Enter your email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Use your Supabase credentials to login. You need admin privileges to access the dashboard.
            </p>

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
