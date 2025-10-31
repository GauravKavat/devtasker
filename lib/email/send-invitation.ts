import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationEmailParams {
  email: string;
  projectName: string;
  inviterName: string;
  invitationToken: string;
}

export async function sendInvitationEmail({
  email,
  projectName,
  inviterName,
  invitationToken,
}: SendInvitationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const invitationUrl = `${appUrl}/invite/${invitationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "DevTasker <onboarding@resend.dev>",
      to: email,
      subject: `You've been invited to join ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DevTasker</h1>
            </div>

            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>

              <p style="font-size: 16px; color: #4b5563; margin: 20px 0;">
                <strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> on DevTasker.
              </p>

              <p style="font-size: 16px; color: #4b5563; margin: 20px 0;">
                DevTasker helps teams collaborate on projects, manage tasks, and track progress efficiently.
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0;">
                ${invitationUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                © 2025 DevTasker. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
}
