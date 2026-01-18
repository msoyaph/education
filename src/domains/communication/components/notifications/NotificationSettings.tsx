import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare } from 'lucide-react';
import type { NotificationPreference } from '../../types/notification';
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from '../../services/notificationService';

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      setError(null);
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(
    eventType: string,
    channel: 'in_app_enabled' | 'push_enabled' | 'email_enabled' | 'sms_enabled',
    currentValue: boolean
  ) {
    try {
      setError(null);
      setSuccessMessage(null);

      const updatedPrefs = preferences.map(pref =>
        pref.event_type === eventType ? { ...pref, [channel]: !currentValue } : pref
      );
      setPreferences(updatedPrefs);

      const pref = updatedPrefs.find(p => p.event_type === eventType);
      if (pref) {
        await updateNotificationPreference(eventType, {
          in_app_enabled: pref.in_app_enabled,
          push_enabled: pref.push_enabled,
          email_enabled: pref.email_enabled,
          sms_enabled: pref.sms_enabled,
        });
        setSuccessMessage('Preferences updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
      await loadPreferences();
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Notification Preferences
          </h1>
          <p className="text-gray-600">
            Choose how you want to receive notifications for different events.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="col-span-1 text-sm font-medium text-gray-700">Event</div>
              <div className="text-center text-sm font-medium text-gray-700 flex items-center justify-center gap-1">
                <Bell className="w-4 h-4" />
                <span>In-App</span>
              </div>
              <div className="text-center text-sm font-medium text-gray-700 flex items-center justify-center gap-1">
                <Smartphone className="w-4 h-4" />
                <span>Push</span>
              </div>
              <div className="text-center text-sm font-medium text-gray-700 flex items-center justify-center gap-1">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <div className="text-center text-sm font-medium text-gray-700 flex items-center justify-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>SMS</span>
              </div>
            </div>

            {preferences.map(pref => (
              <div
                key={pref.event_type}
                className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="col-span-1">
                  <p className="font-medium text-gray-900">{pref.event_name}</p>
                  {pref.event_description && (
                    <p className="text-sm text-gray-500 mt-1">{pref.event_description}</p>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.in_app_enabled}
                      onChange={() =>
                        handleToggle(pref.event_type, 'in_app_enabled', pref.in_app_enabled)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.push_enabled}
                      onChange={() =>
                        handleToggle(pref.event_type, 'push_enabled', pref.push_enabled)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.email_enabled}
                      onChange={() =>
                        handleToggle(pref.event_type, 'email_enabled', pref.email_enabled)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.sms_enabled}
                      onChange={() =>
                        handleToggle(pref.event_type, 'sms_enabled', pref.sms_enabled)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Push notifications require browser permission and email/SMS
              require additional configuration. In-app notifications are always available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
