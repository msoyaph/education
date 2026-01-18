import { supabase } from '../../../shared/lib/supabase';

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user_id?: string;
  user_name?: string;
}

export async function getRecentActivity(schoolId: string, limit = 10): Promise<ActivityItem[]> {
  try {
    // Get recent notifications as activity
    const { data: notifications, error } = await supabase
      .from('notif_queue')
      .select(`
        id,
        event_type,
        title,
        created_at,
        user_id
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    // Get user names for notifications that have user_id
    const userIds = [...new Set((notifications || []).map((n: any) => n.user_id).filter(Boolean))];
    const userMap: Record<string, { first_name: string; last_name: string }> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (users) {
        users.forEach((user: any) => {
          userMap[user.id] = {
            first_name: user.first_name,
            last_name: user.last_name,
          };
        });
      }
    }

    return (notifications || []).map((notif: any) => {
      const user = notif.user_id ? userMap[notif.user_id] : null;
      return {
        id: notif.id,
        type: notif.event_type || 'notification',
        message: notif.title || 'New notification',
        timestamp: notif.created_at,
        user_id: notif.user_id,
        user_name: user ? `${user.first_name} ${user.last_name}` : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
