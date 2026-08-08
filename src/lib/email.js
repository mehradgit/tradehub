import nodemailer from 'nodemailer';

// تنظیمات SMTP (برای مثال با Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: `"FoodHub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - FoodHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e2da; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: #e85d3a; padding: 12px 24px; border-radius: 12px; color: white; font-size: 24px; font-weight: bold;">FoodHub</div>
        </div>
        <h2 style="color: #1e1916;">Verify Your Email Address</h2>
        <p style="color: #3d352e; font-size: 16px; line-height: 1.6;">Thank you for registering with FoodHub! Please use the verification code below to complete your registration:</p>
        <div style="background: #f9f7f4; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e1916;">
          ${code}
        </div>
        <p style="color: #7a6e64; font-size: 14px;">This code will expire in 10 minutes.</p>
        <hr style="border: 1px solid #e8e2da; margin: 20px 0;" />
        <p style="color: #7a6e64; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error };
  }
}