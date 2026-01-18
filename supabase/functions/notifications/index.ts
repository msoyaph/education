import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateNotificationPayload {
  event_type: string;
  recipient_ids: string[];
  event_data: Record<string, any>;
  school_id?: string;
}

function replaceTemplateVars(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;
    
    // Extract route after /functions/v1/notifications
    // e.g., /functions/v1/notifications/unread-count -> unread-count
    const routeMatch = path.match(/\/functions\/v1\/notifications\/(.*)$/);
    const route = routeMatch ? routeMatch[1] : path.replace(/^\//, '');

    // GET / or empty route - Get user's notifications
    if (req.method === 'GET' && (route === '' || route === 'notifications')) {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const status = url.searchParams.get('status');
      const event_type = url.searchParams.get('event_type');

      let query = supabase
        .from('notif_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      if (event_type) {
        query = query.eq('event_type', event_type);
      }

      const { data, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('notif_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'read');

      return new Response(
        JSON.stringify({
          data,
          unread_count: unreadCount || 0,
          total: data?.length || 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET /unread-count
    if (req.method === 'GET' && route === 'unread-count') {
      const { count } = await supabase
        .from('notif_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'read');

      return new Response(
        JSON.stringify({ count: count || 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PUT /:id/read - Mark as read
    if (req.method === 'PUT' && route.endsWith('/read')) {
      const pathSegments = route.split('/').filter(p => p);
      const notificationId = pathSegments[pathSegments.length - 2];

      const { error } = await supabase
        .from('notif_queue')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Notification marked as read' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PUT /mark-all-read
    if (req.method === 'PUT' && route === 'mark-all-read') {
      const { error } = await supabase
        .from('notif_queue')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .neq('status', 'read');

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ message: 'All notifications marked as read' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST /create - Create notifications (system/admin only)
    if (req.method === 'POST' && route === 'create') {
      const body: CreateNotificationPayload = await req.json();

      if (!body.event_type || !body.recipient_ids || !Array.isArray(body.recipient_ids)) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: event_type, recipient_ids' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get event definition
      const { data: event } = await supabase
        .from('notif_events')
        .select('*')
        .eq('event_type', body.event_type)
        .maybeSingle();

      if (!event) {
        return new Response(
          JSON.stringify({ error: 'Invalid event type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const notificationsToCreate = [];

      // Process each recipient
      for (const recipientId of body.recipient_ids) {
        // Get user profile to determine role
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('user_type, school_id')
          .eq('id', recipientId)
          .maybeSingle();

        if (!userProfile) continue;

        // Check if user has subscription preference
        const { data: subscription } = await supabase
          .from('notif_subscriptions')
          .select('*')
          .eq('user_id', recipientId)
          .eq('event_type', body.event_type)
          .maybeSingle();

        // Get template for this role and channel
        const channels = ['in_app']; // Start with in-app
        if (subscription?.push_enabled) channels.push('push');
        if (subscription?.email_enabled) channels.push('email');
        if (!subscription && event.default_enabled) {
          // No preference set, use defaults (in_app only)
          channels.push('in_app');
        }

        for (const channel of channels) {
          const { data: template } = await supabase
            .from('notif_templates')
            .select('*')
            .eq('event_type', body.event_type)
            .eq('channel', channel)
            .eq('role', userProfile.user_type)
            .maybeSingle();

          if (template) {
            const title = replaceTemplateVars(template.title_template, body.event_data);
            const bodyText = replaceTemplateVars(template.body_template, body.event_data);
            const actionUrl = template.action_url_template
              ? replaceTemplateVars(template.action_url_template, body.event_data)
              : null;

            notificationsToCreate.push({
              school_id: body.school_id || userProfile.school_id,
              user_id: recipientId,
              event_type: body.event_type,
              channel,
              title,
              body: bodyText,
              action_url: actionUrl,
              icon: template.icon,
              priority: template.priority,
              event_data: body.event_data,
              status: 'pending',
            });
          }
        }
      }

      if (notificationsToCreate.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No notifications created (no subscriptions or templates)' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: created, error: createError } = await supabase
        .from('notif_queue')
        .insert(notificationsToCreate)
        .select();

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: `Created ${created?.length || 0} notifications`,
          data: created,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET /subscriptions - Get user's subscription preferences
    if (req.method === 'GET' && route === 'subscriptions') {
      const { data: subscriptions } = await supabase
        .from('notif_subscriptions')
        .select('*, notif_events(*)')
        .eq('user_id', user.id);

      // Get all available events for user's role
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      const { data: availableEvents } = await supabase
        .from('notif_events')
        .select('*')
        .contains('available_for_roles', [userProfile?.user_type || 'student']);

      // Merge with user preferences
      const mergedData = (availableEvents || []).map(event => {
        const userSub = (subscriptions || []).find(s => s.event_type === event.event_type);
        return {
          event_type: event.event_type,
          event_name: event.event_name,
          event_description: event.event_description,
          in_app_enabled: userSub?.in_app_enabled ?? true,
          push_enabled: userSub?.push_enabled ?? false,
          email_enabled: userSub?.email_enabled ?? false,
          sms_enabled: userSub?.sms_enabled ?? false,
        };
      });

      return new Response(
        JSON.stringify({ data: mergedData }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST /subscriptions - Update user's subscription preferences
    if (req.method === 'POST' && route === 'subscriptions') {
      const body = await req.json();

      if (!body.event_type) {
        return new Response(
          JSON.stringify({ error: 'Missing event_type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('notif_subscriptions')
        .upsert({
          user_id: user.id,
          event_type: body.event_type,
          in_app_enabled: body.in_app_enabled ?? true,
          push_enabled: body.push_enabled ?? false,
          email_enabled: body.email_enabled ?? false,
          sms_enabled: body.sms_enabled ?? false,
        }, {
          onConflict: 'user_id,event_type',
        });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Subscription updated' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed or route not found' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
