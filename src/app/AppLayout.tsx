'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import MainLayout from './(main)/layout';
import AuthLayout from './(auth)/layout';
import { useAuth } from '@/components/providers/auth-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (loading) {
    // You can return a global loading spinner here
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (user) {
    return <MainLayout>{children}</MainLayout>;
  }

  // This handles the case where the user is not logged in and not on an auth page.
  // The AuthProvider will handle the redirection, so we can return null or a loader.
  return null;
}
