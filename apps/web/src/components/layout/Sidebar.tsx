'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, User, Shield, Settings, LogOut, CalendarRange, HeartPulse, BellRing } from 'lucide-react';
import styles from './Sidebar.module.css';

const MENU_ITEMS = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Trainings', href: '/dashboard/trainings', icon: CalendarRange },
    { name: 'Medical', href: '/dashboard/medical', icon: HeartPulse },
    { name: 'Teams', href: '/dashboard/teams', icon: Shield },
    { name: 'Players', href: '/dashboard/players', icon: Users },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Notifications', href: '/dashboard/notifications', icon: BellRing },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onLogout }) => {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        // Simple polling for now, could be optimized with SWR/TanStack Query or Websockets
        const fetchCount = async () => {
            try {
                // Dynamic import to avoid SSR issues if api uses window/localstorage
                const { getUnreadNotificationCount } = await import('@/lib/api');
                const data = await getUnreadNotificationCount();
                setUnreadCount(data.count);
            } catch (err) {
                // Silent error
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoFull}>Nova<span style={{ color: 'var(--secondary)' }}>Score</span></div>
                </div>

                <nav className={styles.nav}>
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                onClick={onClose} // Close on mobile when clicked
                            >
                                <div className="relative">
                                    <Icon size={20} />
                                    {/* Real notification badge */}
                                    {item.name === 'Notifications' && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[10px] text-white font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <button className={styles.logoutButton} onClick={onLogout}>
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
