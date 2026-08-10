import { env } from '../config/env.js';

type SendEmailInput = { to: string; subject: string; html: string };

async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // Local dev fallback: no sandbox key configured, print instead of send.
    console.log(`\n[email:dev] to=${to} subject="${subject}"\n${html}\n`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${env.CLIENT_ORIGIN}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: 'Verify your H. account',
    html: `<p>Welcome to H. Verify your email to start checking out:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${env.CLIENT_ORIGIN}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: 'Reset your H. password',
    html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
}
