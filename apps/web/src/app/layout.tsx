import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'NovaScore Platform',
  description: 'Manage your club efficiently',
};

import { Toaster } from "@/components/ui/sonner";

import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
