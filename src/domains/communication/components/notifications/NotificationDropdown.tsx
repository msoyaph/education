import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Award,
  Calendar,
  Megaphone,
  CheckCheck,
  Settings,
} from 'lucide-react';
import type { Notification } from '../../types/notification';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead: () => void;
  onAllRead: () => void;
}

const iconMap: Record<string, any> = {
  'check-circle': CheckCircle,
  'alert-circle': AlertCircle,
  'clock': Clock,
  'x-circle': XCircle,
  'award': Award,
  'calendar': Calendar,
  'megaphone': Megaphone,
  'alert-triangle': AlertCircle,
};

export function NotificationDropdown({
  onClose,
  onNotificationRead,
  onAllRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const response = await getNotifications(20, 0);
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, status: 'read' } : n))
      );
      onNotificationRead();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      onAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-PH');
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300';
      case 'high':
        return 'bg-orange-100 border-orange-300';
      case 'low':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => {
              const Icon = iconMap[notification.icon || 'alert-circle'] || AlertCircle;
              const isUnread = notification.status !== 'read';

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isUnread ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (isUnread) handleMarkAsRead(notification.id);
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}
                    >
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm">
                          {notification.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Notification Settings
        </button>
      </div>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
