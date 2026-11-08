import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be configured');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

function getSenderAddress() {
  const sender = process.env.GMAIL_USER;
  if (!sender) {
    throw new Error('GMAIL_USER must be configured');
  }
  return sender;
}

export async function sendEmailVerificationOtp({ to, otp, fullName }) {
  const transporter = getTransporter();
  const from = getSenderAddress();
  const safeName = String(fullName || 'there').replace(/[&<>"]/g, '');

  await transporter.sendMail({
    from: {
      name: 'Heaven Gym',
      address: from,
    },
    to,
    subject: 'Verify your Heaven Gym email address',
    text: `Hello ${safeName}, your email verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>Verify your email</h2><p>Hello ${safeName},</p><p>Use this code to verify your Heaven Gym account:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${otp}</div><p>This code expires in 5 minutes. Do not share it with anyone.</p></div>`,
  });
}

export async function sendPasswordResetEmail({ to, token }) {
  const transporter = getTransporter();
  const baseUrl = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: {
      name: 'Heaven Gym',
      address: getSenderAddress(),
    },
    to,
    subject: 'Reset your gym account password',
    text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 60 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
