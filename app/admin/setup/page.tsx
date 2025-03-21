'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { addAdminUser } from '@/lib/db';
import { validateEmail } from '@/lib/utils';

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Check if any admin users already exist
      const { data: existingAdmins, error: adminsError } = await supabase
        .from('users')
        .select('id')
        .eq('is_admin', true)
        .limit(1);

      if (adminsError) {
        throw new Error('Failed to check existing admins');
      }

      // Only proceed if there are no admin users yet
      if (existingAdmins && existingAdmins.length > 0) {
        toast({
          title: "Setup already completed",
          description: "Admin users already exist. Please log in instead.",
          variant: "destructive",
        });
        router.push('/admin/login');
        return;
      }

      // Register the user with Supabase auth
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // Make the user an admin in our database
      const success = await addAdminUser(email);

      if (!success) {
        throw new Error('Failed to set admin privileges');
      }

      toast({
        title: "Setup complete",
        description: "Super admin account created successfully. You can now log in.",
      });

      router.push('/admin/login');
    } catch (error: any) {
      console.error('Setup error:', error);
      setError(error.message || 'An error occurred during setup');
      toast({
        title: "Setup failed",
        description: error.message || "Failed to create super admin account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Create the first super admin account for Instant ClipBoard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSetup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yourcompany.com"
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
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will be the first admin account with full access to the admin dashboard.
              This setup can only be performed once.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating admin account...
                </>
              ) : (
                "Create Super Admin"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
