'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isLoading, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (!user) return null;

    const handleLogout = () => {
        logout();
    };

    if (!user) return null; // Avoid flashing content before redirect

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* On desktop, pad request content to not interact with fixed sidebar if necessary, 
            but here sidebar pushes content or is overlay depending on design.
            Ideally for responsive sidebar on desktop it takes space. 
            Let's adjust: desktop fixed width 280px.
        */}
                <div className="desktop-spacer" />

                <TopBar onMenuClick={() => setIsSidebarOpen(true)} user={user} />

                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    {children}
                </main>
            </div>

            <style jsx global>{`
        /* Desktop: Main content gets left margin */
        @media (min-width: 769px) {
          .desktop-spacer {
             display: none; /* We use margin-left on main wrapper instead or make Sidebar position sticky? */
          }
          /* Let's actually make the main container have padding-left equal to sidebar width */
          main { 
             /* The Sidebar is fixed. We need to push content */
          }
        }
      `}</style>

            {/* 
          Refined Layout Approach:
          Sidebar is fixed left. 
          Main content should have a margin-left of 280px on desktop.
      */}
            <style jsx>{`
        @media (min-width: 769px) {
           div[style*="flex: 1"] {
              margin-left: 280px; 
           }
        }
      `}</style>
        </div>
    );
}
