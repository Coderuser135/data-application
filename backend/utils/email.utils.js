import nodemailer from 'nodemailer';

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPassword) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPassword },
    });
  }

  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  if (required.some((key) => !process.env[key])) {
    throw new Error('Configure GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

function getSenderAddress() {
  return process.env.GMAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER;
}

export async function sendEmailVerificationOtp({ to, otp, fullName }) {
  const transporter = getTransporter();
  const sender = getSenderAddress();
  if (!sender) throw new Error('Email sender address is not configured');
  const safeName = String(fullName || 'there').replace(/[&<>"]/g, '');

  await transporter.sendMail({
    from: { name: 'IronForge Gym', address: sender },
    to,
    subject: 'Verify your IronForge email address',
    text: `Hello ${safeName}, your email verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>Verify your email</h2><p>Hello ${safeName},</p><p>Use this code to verify your IronForge account:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${otp}</div><p>This code expires in 5 minutes. Do not share it with anyone.</p></div>`,
  });
}

export async function sendPasswordResetEmail({ to, token }) {
  const transporter = getTransporter();
  const sender = getSenderAddress();
  if (!sender) throw new Error('Email sender address is not configured');
  const baseUrl = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: { name: 'IronForge Gym', address: sender },
    to,
    subject: 'Reset your gym account password',
    text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 60 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
