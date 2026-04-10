import { supabase } from '../config/supabase';
import { emailService } from './emailService';

type NotificationType =
  | 'new_student_request'
  | 'request_approved_by_admin'
  | 'material_rated'
  | 'comment_reported_confirmation'
  | 'admin_action_in_dept'
  | 'moderator_added'
  | 'guideline_reminder'
  | 'system_alert'
  | 'moderator_request_decision'
  | 'upload_request_decision';

export const notificationService = {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>
  ) {
    const { data } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      metadata: metadata || null,
    }).select().single();

    // For high-priority notifications, also send email
    const emailTriggers: NotificationType[] = [
      'upload_request_decision',
      'moderator_request_decision',
      'moderator_added'
    ];

    if (emailTriggers.includes(type)) {
      const { data: profile } = await supabase
        .from('profiles').select('email, full_name').eq('id', userId).single();
      if (profile?.email) {
        await emailService.sendNotificationEmail(profile.email, profile.full_name, title, body);
      }
    }

    return data;
  },
};
