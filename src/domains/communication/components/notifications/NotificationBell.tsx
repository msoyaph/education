import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../../services/notificationService';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // Silently handle errors - getUnreadCount already returns 0 on failure
      // Only log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load unread count:', err);
      }
      setUnreadCount(0);
    }
  }

  function handleNotificationRead() {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  function handleAllRead() {
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown
          onClose={() => setShowDropdown(false)}
          onNotificationRead={handleNotificationRead}
          onAllRead={handleAllRead}
        />
      )}
    </div>
  );
}
