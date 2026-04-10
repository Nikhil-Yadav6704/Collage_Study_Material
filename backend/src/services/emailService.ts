import { resend } from '../config/resend';

export const emailService = {
  async sendNotificationEmail(
    to: string,
    name: string,
    subject: string,
    message: string
  ) {
    try {
      await resend.emails.send({
        from: 'EduVault <noreply@yourdomain.com>',
        to,
        subject: `EduVault: ${subject}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #6366f1;">EduVault</h2>
            <p>Hi ${name},</p>
            <p>${message}</p>
            <a href="${process.env.FRONTEND_URL}" style="
              display: inline-block; background: #6366f1; color: white;
              padding: 10px 20px; border-radius: 8px; text-decoration: none;
              margin-top: 16px; font-weight: 600;
            ">Open EduVault</a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              EduVault · Your college study portal
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Email send failed:', err);
      // Don't throw — email failure shouldn't break the main flow
    }
  },
};
