import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const [list, countData] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount()
      ]);
      setNotifications(list.slice(0, 5));
      setUnreadCount(countData.unread_count);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignored
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    await api.markAllNotificationsRead();
                    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                    setUnreadCount(0);
                  }}
                  className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-slate-50 transition-colors text-left flex gap-3 ${
                      !n.is_read ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="self-center p-1 text-slate-400 hover:text-teal-600 rounded"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
              <Link
                to={user.role === 'CITIZEN' ? '/citizen/notifications' : '/officer/dashboard'}
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 py-1"
              >
                <span>View all activity</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
