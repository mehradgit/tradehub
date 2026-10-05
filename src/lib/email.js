// src/lib/email.js
import nodemailer from "nodemailer";

// ====== SMTP configuration (unchanged) ======
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ====== Constants ======
const APP_NAME = "FoodTradeLink";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ====== Base email layout ======
function emailLayout(content) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e2da; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #13795b; padding: 12px 24px; border-radius: 12px; color: white; font-size: 22px; font-weight: bold;">
          ${APP_NAME}
        </div>
      </div>
      ${content}
      <hr style="border: 1px solid #e8e2da; margin: 24px 0;" />
      <p style="color: #7a6e64; font-size: 11px; text-align: center; margin: 0;">
        This is an automated message from ${APP_NAME}. Please do not reply directly to this email.
      </p>
    </div>
  `;
}

// ====== 1. Email verification email (same as before - unchanged) ======
// ====== 1. Email verification email (link-based) ======
export async function sendVerificationEmail(email, verificationUrl) {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email Address — FoodTradeLink",
    html: emailLayout(`
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 50%;
                    background: linear-gradient(135deg, #13795b, #1d9a71);
                    display: grid; place-items: center; color: white;
                    font-size: 32px;">
          ✉
        </div>
        <h2 style="color: #13251f; margin: 0 0 10px; font-family: Manrope, sans-serif;">
          Verify Your Email
        </h2>
        <p style="color: #71807b; font-size: 15px; line-height: 1.6;
                  max-width: 420px; margin: 0 auto;">
          Thanks for signing up with ${APP_NAME}! Please click the button below
          to verify your email address and activate your account.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}"
           style="display: inline-block;
                  background: linear-gradient(135deg, #13795b, #1d9a71);
                  color: white;
                  padding: 14px 40px;
                  border-radius: 50px;
                  text-decoration: none;
                  font-weight: 700;
                  font-size: 15px;
                  box-shadow: 0 8px 20px rgba(19,121,91,0.25);">
          Verify Email Address →
        </a>
      </div>

      <p style="color: #71807b; font-size: 13px; text-align: center;
                line-height: 1.6; margin-top: 24px;">
        This link will expire in <strong style="color: #13251f;">24 hours</strong>.
      </p>

      <hr style="border: 0; border-top: 1px solid #e8e2da; margin: 24px 0;" />

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #13795b; font-size: 12px; word-break: break-all;
                background: #f9f7f4; padding: 10px 14px; border-radius: 8px;">
        ${verificationUrl}
      </p>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        If you didn't create an account with ${APP_NAME}, you can safely ignore
        this email.
      </p>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Verification email error:", error);
    return { success: false, error };
  }
}

// ============================================================
// ✅ New functions for the ticket system (add these)
// ============================================================

// ====== 2. New ticket email to admins ======
export async function sendNewTicketEmailToAdmin({
  adminEmail,
  ticketNumber,
  ticketSubject,
  category,
  priority,
  userName,
  messagePreview,
}) {
  const link = `${BASE_URL}/admin/tickets/${ticketNumber}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[Ticket #${ticketNumber}] New Support Ticket`,
    html: emailLayout(`
      <h2 style="color: #1e1916;">New Support Ticket</h2>
      <p style="color: #3d352e; font-size: 15px; line-height: 1.6;">
        A new support ticket has been created and requires your attention.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #7a6e64; width: 130px;">Ticket #:</td>
          <td style="padding: 8px 0; color: #1e1916; font-weight: 700;">#${ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7a6e64;">Subject:</td>
          <td style="padding: 8px 0; color: #1e1916; font-weight: 600;">${ticketSubject}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7a6e64;">From:</td>
          <td style="padding: 8px 0; color: #1e1916;">${userName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7a6e64;">Category:</td>
          <td style="padding: 8px 0; color: #1e1916;">${category}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7a6e64;">Priority:</td>
          <td style="padding: 8px 0; color: #1e1916; text-transform: uppercase; font-weight: 700;">
            ${priority}
          </td>
        </tr>
      </table>

      <div style="background: #f9f7f4; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 3px solid #13795b;">
        <p style="margin: 0; color: #3d352e; font-size: 14px; line-height: 1.6;">
          ${messagePreview}
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${link}" style="display: inline-block; background: #13795b; color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
          View &amp; Reply →
        </a>
      </div>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Admin ticket email error:", error);
    return { success: false, error };
  }
}

// ====== 3. Admin reply email to the user ======
export async function sendTicketReplyEmailToUser({
  userEmail,
  ticketNumber,
  ticketSubject,
  adminName,
  messagePreview,
}) {
  const link = `${BASE_URL}/dashboard/support/${ticketNumber}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `[Ticket #${ticketNumber}] New reply from support`,
    html: emailLayout(`
      <h2 style="color: #1e1916;">New Reply on Your Ticket</h2>
      <p style="color: #3d352e; font-size: 15px; line-height: 1.6;">
        <strong>${adminName}</strong> from support team replied to your ticket <strong>#${ticketNumber}</strong>:
      </p>

      <p style="color: #7a6e64; font-size: 13px; margin-top: 8px;">
        Subject: <strong style="color: #1e1916;">${ticketSubject}</strong>
      </p>

      <div style="background: #f9f7f4; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 3px solid #13795b;">
        <p style="margin: 0; color: #3d352e; font-size: 14px; line-height: 1.6;">
          ${messagePreview}
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${link}" style="display: inline-block; background: #13795b; color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
          View &amp; Reply →
        </a>
      </div>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("User ticket reply email error:", error);
    return { success: false, error };
  }
}

// ====== 4. User reply email to admins ======
export async function sendTicketReplyEmailToAdmin({
  adminEmail,
  ticketNumber,
  ticketSubject,
  userName,
  messagePreview,
}) {
  const link = `${BASE_URL}/admin/tickets/${ticketNumber}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[Ticket #${ticketNumber}] New reply from ${userName}`,
    html: emailLayout(`
      <h2 style="color: #1e1916;">New Reply from User</h2>
      <p style="color: #3d352e; font-size: 15px; line-height: 1.6;">
        <strong>${userName}</strong> replied to ticket <strong>#${ticketNumber}</strong>:
      </p>

      <p style="color: #7a6e64; font-size: 13px; margin-top: 8px;">
        Subject: <strong style="color: #1e1916;">${ticketSubject}</strong>
      </p>

      <div style="background: #f9f7f4; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 3px solid #d97706;">
        <p style="margin: 0; color: #3d352e; font-size: 14px; line-height: 1.6;">
          ${messagePreview}
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${link}" style="display: inline-block; background: #13795b; color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
          View &amp; Reply →
        </a>
      </div>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Admin ticket reply email error:", error);
    return { success: false, error };
  }
}

// ====== helper: truncate text ======
export function truncateMessage(text, maxLength = 200) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// ====== 5. Contact form email ======
export async function sendContactEmail({ name, email, subject, message }) {
  const adminEmail = process.env.SMTP_USER; // your own email

  const mailOptions = {
    from: `"${APP_NAME} Contact" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html: emailLayout(`
      <h2 style="color: #1e1916;">New Contact Message</h2>
      <p style="color: #3d352e; font-size: 15px; line-height: 1.6;">
        You received a new message from the contact form.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #7a6e64; width: 100px;">Name:</td>
          <td style="padding: 8px 0; color: #1e1916; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7a6e64;">Email:</td>
          <td style="padding: 8px 0; color: #1e1916;">
            <a href="mailto:${email}" style="color: #13795b;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7a6e64;">Subject:</td>
          <td style="padding: 8px 0; color: #1e1916; font-weight: 600;">${subject}</td>
        </tr>
      </table>

      <div style="background: #f9f7f4; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 3px solid #13795b;">
        <p style="margin: 0; color: #3d352e; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
          ${message}
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
           style="display: inline-block; background: #13795b; color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Reply to ${name} →
        </a>
      </div>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Contact email error:", error);
    return { success: false, error };
  }
}

// ====== 6. Password reset email ======
export async function sendPasswordResetEmail(email, resetUrl) {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password — FoodTradeLink",
    html: emailLayout(`
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 50%;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    display: grid; place-items: center; color: white;
                    font-size: 32px;">
          🔒
        </div>
        <h2 style="color: #13251f; margin: 0 0 10px; font-family: Manrope, sans-serif;">
          Reset Your Password
        </h2>
        <p style="color: #71807b; font-size: 15px; line-height: 1.6;
                  max-width: 440px; margin: 0 auto;">
          We received a request to reset the password for your ${APP_NAME} account.
          Click the button below to set a new password.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block;
                  background: linear-gradient(135deg, #f59e0b, #d97706);
                  color: white;
                  padding: 14px 40px;
                  border-radius: 50px;
                  text-decoration: none;
                  font-weight: 700;
                  font-size: 15px;
                  box-shadow: 0 8px 20px rgba(245,158,11,0.25);">
          Reset Password →
        </a>
      </div>

      <div style="background: #fff8e8; border: 1px solid #fde68a;
                  border-radius: 12px; padding: 14px 18px; margin: 24px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
          ⏱ <strong>This link will expire in 1 hour.</strong> If you didn't
          request a password reset, you can safely ignore this email — your
          password won't be changed.
        </p>
      </div>

      <hr style="border: 0; border-top: 1px solid #e8e2da; margin: 24px 0;" />

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #d97706; font-size: 12px; word-break: break-all;
                background: #f9f7f4; padding: 10px 14px; border-radius: 8px;">
        ${resetUrl}
      </p>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Password reset email error:", error);
    return { success: false, error };
  }
}