'use client';

import React from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './TopBar.module.css';

interface TopBarProps {
    onMenuClick: () => void;
    user: any;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, user }) => {
    const { theme, toggleTheme } = useTheme();
    const [unreadCount, setUnreadCount] = React.useState(0);
    const router = require('next/navigation').useRouter();

    React.useEffect(() => {
        const fetchUnread = async () => {
            try {
                // Determine if we are in Portal or Dashboard context
                // For now assuming Club Dashboard as Portal has different layout?
                // Actually TopBar is used in DashboardLayout.
                // We need to import API safely.
                const { getUnreadNotificationCount } = await import('@/lib/api');
                const data = await getUnreadNotificationCount();
                setUnreadCount(data.count);
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };
        fetchUnread();

        // Poll every minute
        const interval = setInterval(fetchUnread, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className={styles.header}>
            <button className={styles.menuBtn} onClick={onMenuClick}>
                <Menu size={24} />
            </button>

            <div className={styles.titleMobile}>Nova<span style={{ color: 'var(--secondary)' }}>Score</span></div>

            <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button className={styles.iconBtn} onClick={() => router.push('/dashboard/notifications')}>
                    <Bell size={20} />
                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>
                        {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
                </div>
            </div>
        </header>
    );
};
