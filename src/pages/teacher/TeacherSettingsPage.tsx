/**
 * Teacher Settings Page
 * 
 * Teacher-specific settings and preferences
 * School-scoped and respects multi-tenancy
 */

import { Settings, Bell, Shield, User, Save, Globe, Moon, Sun, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { supabase } from '../../shared/lib/supabase';

interface SettingsData {
  // General
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  attendanceReminders: boolean;
  gradeNotifications: boolean;
  messageNotifications: boolean;
  
  // Security
  twoFactorEnabled: boolean;
  sessionTimeout: number;
}

function TeacherSettingsPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    language: 'en',
    timezone: 'Asia/Manila',
    theme: 'system',
    emailNotifications: true,
    pushNotifications: true,
    attendanceReminders: true,
    gradeNotifications: true,
    messageNotifications: true,
    twoFactorEnabled: false,
    sessionTimeout: 30,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: User },
  ];

  useEffect(() => {
    // Load user settings from database or localStorage
    loadSettings();
  }, [profile?.id]);

  const loadSettings = async () => {
    if (!profile?.id) return;

    try {
      // Try to load from user_profiles metadata
      const { data, error } = await supabase
        .from('user_profiles')
        .select('metadata')
        .eq('id', profile.id)
        .single();

      if (!error && data?.metadata) {
        const savedSettings = data.metadata as Partial<SettingsData>;
        setSettings((prev) => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem(`teacher_settings_${profile.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      // Save to user_profiles metadata
      const { error } = await supabase
        .from('user_profiles')
        .update({
          metadata: settings,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Also save to localStorage as backup
      localStorage.setItem(`teacher_settings_${profile.id}`, JSON.stringify(settings));

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your preferences and account settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Manila">Asia/Manila (Philippines)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      Theme
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === 'light'}
                          onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Light</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === 'dark'}
                          onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Dark</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="system"
                          checked={settings.theme === 'system'}
                          onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">System</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                      <p className="text-xs text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Push Notifications</label>
                      <p className="text-xs text-gray-500">Receive browser push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Attendance Reminders</label>
                      <p className="text-xs text-gray-500">Get reminders to mark attendance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.attendanceReminders}
                        onChange={(e) => updateSetting('attendanceReminders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Grade Notifications</label>
                      <p className="text-xs text-gray-500">Notifications when grades are submitted</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.gradeNotifications}
                        onChange={(e) => updateSetting('gradeNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Message Notifications</label>
                      <p className="text-xs text-gray-500">Notifications for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.messageNotifications}
                        onChange={(e) => updateSetting('messageNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Two-Factor Authentication</label>
                      <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.twoFactorEnabled}
                        onChange={(e) => updateSetting('twoFactorEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Automatic logout after inactivity (5-120 minutes)</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Keep your account secure by using a strong password and enabling two-factor authentication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Preferences</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      Teaching preferences are managed by your school administrator. Contact your administrator to change these settings.
                    </p>
                  </div>

                  {school && (
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Current School</h4>
                      <p className="text-sm text-gray-600">{school.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{school.code}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TeacherSettingsPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={[]}>
        <TeacherSettingsPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
