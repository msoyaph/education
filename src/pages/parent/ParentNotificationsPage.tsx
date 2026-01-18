/**
 * Parent Notifications Page
 * 
 * View all notifications for parent account
 * School-scoped and respects multi-tenancy
 */

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
  Filter,
  Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import type { Notification } from '../../domains/communication/types/notification';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../domains/communication/services/notificationService';

const iconMap: Record<string, any> = {
  'check-circle': CheckCircle,
  'alert-circle': AlertCircle,
  'clock': Clock,
  'x-circle': XCircle,
  'award': Award,
  'calendar': Calendar,
  'megaphone': Megaphone,
  'alert-triangle': AlertCircle,
  'bell': Bell,
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

type FilterType = 'all' | 'unread' | 'read';

function ParentNotificationsPageContent() {
  const { profile } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter === 'unread' ? 'pending' : 'read';
      const response = await getNotifications(100, 0, status);
      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, status: 'read' } as Notification : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' } as Notification)));
      setUnreadCount(0);
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
    return date.toLocaleDateString();
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.status !== 'read';
    if (filter === 'read') return n.status === 'read';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated on your children's activities</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}
          <Link
            to="/notifications/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'read'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No Unread Notifications' : 
               filter === 'read' ? 'No Read Notifications' : 
               'No Notifications Yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? 'You\'re all caught up!'
                : filter === 'read'
                ? 'No read notifications to display'
                : 'Notifications will appear here when teachers post updates about your children'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const Icon = iconMap[notification.icon || 'bell'] || Bell;
              const isUnread = notification.status !== 'read';

              return (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    isUnread ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      isUnread ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isUnread ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{getTimeAgo(notification.created_at)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              priorityColors[notification.priority] || priorityColors.normal
                            }`}>
                              {notification.priority}
                            </span>
                            {notification.event_type && (
                              <span className="capitalize">
                                {notification.event_type.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>

                      {notification.action_url && (
                        <Link
                          to={notification.action_url}
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ParentNotificationsPage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['notifications:read']}>
        <ParentNotificationsPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
