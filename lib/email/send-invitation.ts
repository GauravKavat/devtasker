import nodemailer from "nodemailer";

// Create Gmail transporter using company email
// Only create transporter if credentials are provided
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn("Gmail credentials not configured. Email functionality disabled.");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
};

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

  const transporter = createTransporter();

  // If email is not configured, just log the invitation URL
  if (!transporter) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL NOT CONFIGURED - Invitation Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To: ${email}`);
    console.log(`Project: ${projectName}`);
    console.log(`Invited by: ${inviterName}`);
    console.log(`Invitation URL: ${invitationUrl}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nℹ️  To enable email sending:");
    console.log("1. Go to your Google Account settings");
    console.log("2. Enable 2-Factor Authentication");
    console.log("3. Generate an App Password: https://myaccount.google.com/apppasswords");
    console.log("4. Add to .env.local:");
    console.log("   GMAIL_USER=your-email@gmail.com");
    console.log("   GMAIL_APP_PASSWORD=your-16-char-app-password");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { success: true, emailSent: false, invitationUrl };
  }

  try {
    await transporter.sendMail({
      from: '"DevTasker" <hello.devtasker@gmail.com>',
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

    return { success: true, emailSent: true };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
}
