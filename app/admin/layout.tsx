'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const [localAdminAuth, setLocalAdminAuth] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isSetupPage = pathname === '/admin/setup';

  // Check for localStorage admin auth for development
  useEffect(() => {
    try {
      const localAuth = localStorage.getItem('admin_auth');
      if (localAuth) {
        const authData = JSON.parse(localAuth);
        // Validate timestamp - require login every 24 hours
        if (authData.timestamp && Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
          setLocalAdminAuth(true);
        } else {
          // Clear expired auth
          localStorage.removeItem('admin_auth');
          setLocalAdminAuth(false);
        }
      } else {
        setLocalAdminAuth(false);
      }
    } catch (error) {
      console.error('Error checking local admin auth:', error);
      setLocalAdminAuth(false);
    }
  }, [pathname]);

  useEffect(() => {
    // Don't redirect on the login page or setup page
    if (isLoginPage || isSetupPage) return;

    // Wait for auth state to be determined
    if (loading && !localAdminAuth) return;

    // If using local admin auth for development, allow access
    if (localAdminAuth) return;

    // If user is not authenticated, redirect to login
    if (!user) {
      router.push('/admin/login');
      return;
    }

    // If user is authenticated but not an admin, redirect to login
    if (user && !isAdmin) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, router, loading, isLoginPage, isSetupPage, localAdminAuth]);

  // Show loading state when checking auth
  if (loading && !localAdminAuth && !isLoginPage && !isSetupPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}
