'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api';
import { toast } from 'sonner';

interface Notification {
    id: string;
    clubId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications({ limit: 50 });
            setNotifications(data.data);
        } catch (error: any) {
            toast.error('Erro ao carregar notificações: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast.success('Todas as notificações marcadas como lidas');
        } catch (error) {
            toast.error('Erro ao marcar como lidas');
        }
    };

    const handleClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">A carregar...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Notificações</h1>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <div className="text-4xl mb-4">🔕</div>
                    <h3 className="text-lg font-medium text-slate-900">Sem notificações</h3>
                    <p className="text-slate-500">Não tem notificações recentes.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleClick(notification)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${notification.isRead
                                    ? 'bg-white border-slate-200 hover:border-slate-300'
                                    : 'bg-indigo-50 border-indigo-200 hover:border-indigo-300 shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-semibold ${notification.isRead ? 'text-slate-800' : 'text-indigo-900'}`}>
                                            {notification.title}
                                        </h4>
                                        {!notification.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 block"></span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${notification.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-slate-400 mt-2 block">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {notification.type === 'WITHDRAWAL_REQUEST' && (
                                    <div className="text-2xl">📤</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
