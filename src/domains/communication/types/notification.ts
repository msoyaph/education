export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface NotificationEvent {
  id: string;
  event_type: string;
  event_name: string;
  event_description?: string;
  default_enabled: boolean;
  available_for_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  event_type: string;
  channel: NotificationChannel;
  role: string;
  title_template: string;
  body_template: string;
  action_url_template?: string;
  icon?: string;
  priority: NotificationPriority;
  created_at: string;
  updated_at: string;
}

export interface NotificationSubscription {
  id: string;
  user_id: string;
  event_type: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  school_id?: string;
  user_id: string;
  event_type: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  action_url?: string;
  icon?: string;
  priority: NotificationPriority;
  event_data: Record<string, any>;
  status: NotificationStatus;
  read_at?: string;
  delivered_at?: string;
  failed_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationPayload {
  event_type: string;
  recipient_ids: string[];
  event_data: Record<string, any>;
  school_id?: string;
}

export interface NotificationPreference {
  event_type: string;
  event_name: string;
  event_description?: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
}

export interface NotificationResponse {
  data: Notification[];
  unread_count: number;
  total: number;
}
