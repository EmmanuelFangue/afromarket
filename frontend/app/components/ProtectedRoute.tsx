'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string[];
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const locale = pathname.split('/')[1];
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isLoading && isAuthenticated && requireRole) {
      const hasRole = requireRole.some(role => user?.roles.includes(role));
      if (!hasRole) {
        router.push(`/${pathname.split('/')[1]}`);
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, requireRole, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireRole) {
    const hasRole = requireRole.some(role => user?.roles.includes(role));
    if (!hasRole) {
      return null;
    }
  }

  return <>{children}</>;
}
