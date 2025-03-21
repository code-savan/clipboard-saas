'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Don't redirect on the login page
    if (isLoginPage) return;

    // Wait for auth state to be determined
    if (loading) return;

    // If user is not authenticated, redirect to login
    if (!user) {
      router.push('/admin/login');
      return;
    }

    // If user is authenticated but not an admin, redirect to login
    if (user && !isAdmin) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, router, loading, isLoginPage]);

  // Show loading state when checking auth
  if (loading && !isLoginPage) {
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
