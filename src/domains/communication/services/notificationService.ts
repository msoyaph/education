import { supabase } from '../../../shared/lib/supabase';
import type {
  Notification,
  NotificationResponse,
  NotificationPreference,
  CreateNotificationPayload,
} from '../types/notification';

const NOTIFICATION_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notifications`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function getNotifications(
  limit = 50,
  offset = 0,
  status?: string,
  eventType?: string
): Promise<NotificationResponse> {
  const headers = await getAuthHeaders();

  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  if (status) params.append('status', status);
  if (eventType) params.append('event_type', eventType);

  const response = await fetch(`${NOTIFICATION_FUNCTION_URL}?${params.toString()}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch notifications');
  }

  return response.json();
}

export async function getUnreadCount(): Promise<number> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${NOTIFICATION_FUNCTION_URL}/unread-count`, {
      headers,
    });

    if (!response.ok) {
      // If unauthorized, return 0 instead of throwing
      if (response.status === 401) {
        console.warn('Not authenticated for notifications');
        return 0;
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch unread count' }));
      throw new Error(error.error || 'Failed to fetch unread count');
    }

    const result = await response.json();
    return result.count || 0;
  } catch (error) {
    // If not authenticated, silently return 0 instead of throwing
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return 0;
    }
    // Log other errors but don't throw - allow UI to continue
    console.warn('Failed to load unread notification count:', error);
    return 0;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${NOTIFICATION_FUNCTION_URL}/${notificationId}/read`, {
    method: 'PUT',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark notification as read');
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${NOTIFICATION_FUNCTION_URL}/mark-all-read`, {
    method: 'PUT',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark all notifications as read');
  }
}

export async function createNotification(payload: CreateNotificationPayload): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${NOTIFICATION_FUNCTION_URL}/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create notification');
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${NOTIFICATION_FUNCTION_URL}/subscriptions`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch preferences');
  }

  const result = await response.json();
  return result.data;
}

export async function updateNotificationPreference(
  eventType: string,
  preferences: {
    in_app_enabled?: boolean;
    push_enabled?: boolean;
    email_enabled?: boolean;
    sms_enabled?: boolean;
  }
): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${NOTIFICATION_FUNCTION_URL}/subscriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event_type: eventType,
      ...preferences,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update preference');
  }
}

/**
 * Send attendance notification
 * 
 * TODO: Backend must move this to Edge Function
 * This function uses direct Supabase queries which should be moved to backend
 * for proper tenant isolation and security
 */
export async function sendAttendanceNotification(
  attendanceRecord: {
    student_id: string;
    class_id: string;
    class_name: string;
    attendance_date: string;
    status: string;
    check_in_time?: string;
  }
): Promise<void> {
  // TODO: Replace with API call to Edge Function
  // await apiPost('/notifications/attendance', attendanceRecord);
  
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, user_id, school_id')
    .eq('id', attendanceRecord.student_id)
    .maybeSingle();

  if (!student) return;

  const recipientIds: string[] = [];

  if (student.user_id) {
    recipientIds.push(student.user_id);
  }

  const { data: parents } = await supabase
    .from('student_parents')
    .select('parents(user_id)')
    .eq('student_id', attendanceRecord.student_id);

  if (parents) {
    parents.forEach((p: any) => {
      if (p.parents?.user_id) {
        recipientIds.push(p.parents.user_id);
      }
    });
  }

  if (recipientIds.length === 0) return;

  const studentName = `${student.first_name} ${student.last_name}`;

  const eventData = {
    student_id: attendanceRecord.student_id,
    student_name: studentName,
    class_name: attendanceRecord.class_name,
    date: attendanceRecord.attendance_date,
    status: attendanceRecord.status,
    check_in_time: attendanceRecord.check_in_time || '',
  };

  let eventType = 'attendance_marked';
  if (attendanceRecord.status === 'absent') {
    eventType = 'attendance_absent';
  } else if (attendanceRecord.status === 'late') {
    eventType = 'attendance_late';
  }

  await createNotification({
    event_type: eventType,
    recipient_ids: recipientIds,
    event_data: eventData,
    school_id: student.school_id,
  });
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notif_queue_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notif_queue',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
