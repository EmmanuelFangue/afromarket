'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import Header from './Header';
import { Toaster } from 'sonner';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <main>{children}</main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E7E5E4',
            borderRadius: '1rem',
          },
        }}
      />
    </AuthProvider>
  );
}
