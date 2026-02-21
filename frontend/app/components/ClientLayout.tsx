'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import Header from './Header';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      {children}
    </AuthProvider>
  );
}
