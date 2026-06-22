/**
 * Convolo Email Utility — Resend-powered transactional emails.
 *
 * Provides:
 * - sendEmail()           — low-level sender (used by all templates)
 * - sendWelcomeEmail()    — post-signup welcome
 * - sendStreakReminder()  — daily streak nudge
 * - sendPasswordResetEmail() — password reset link
 * - sendProUpgradeEmail() — Pro plan confirmation
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://convolo.vercel.app";
const FROM = "Convolo <noreply@convolo.app>";

/* ────────────────────────── shared helpers ────────────────────────── */

function baseStyles() {
  return `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a2e;
    line-height: 1.6;
    max-width: 560px;
    margin: 0 auto;
    padding: 32px 24px;
    background-color: #ffffff;
  `;
}

function ctaButton(href: string, label: string, bgColor = "#6C3CE1") {
  return `
    <a href="${href}"
       style="display:inline-block;padding:14px 32px;background-color:${bgColor};color:#ffffff;
              text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;
              letter-spacing:0.2px;">
      ${label}
    </a>
  `;
}

function footer() {
  return `
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      <p>Convolo — Conversation, Unlocked.</p>
      <p style="margin-top:4px;">If you didn't expect this email, you can safely ignore it.</p>
    </div>
  `;
}

/* ────────────────────────── core sender ────────────────────────── */

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email");
    return;
  }

  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}

/* ────────────────────────── Welcome Email ────────────────────────── */

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(" ")[0] || "there";

  const html = `
    <div style="${baseStyles()}">
      <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">Welcome to Convolo! 🎉</h1>
      <p style="font-size:16px;margin:0 0 24px;color:#4b5563;">
        Hey ${firstName}, we're thrilled to have you on board.
      </p>

      <p style="font-size:15px;margin:0 0 20px;">
        Convolo helps you master any language through real conversations with AI.
        Here's what you can do:
      </p>

      <ul style="font-size:15px;margin:0 0 28px;padding-left:20px;color:#374151;">
        <li style="margin-bottom:8px;"><strong>Practice speaking</strong> — immersive AI conversations in 20+ languages</li>
        <li style="margin-bottom:8px;"><strong>Get instant corrections</strong> — real-time feedback on grammar & pronunciation</li>
        <li style="margin-bottom:8px;"><strong>Build vocabulary</strong> — spaced-repetition reviews that stick</li>
        <li style="margin-bottom:8px;"><strong>Track your progress</strong> — streaks, achievements, and detailed stats</li>
      </ul>

      <div style="text-align:center;">
        ${ctaButton(`${APP_URL}/dashboard`, "Start Practicing →")}
      </div>

      ${footer()}
    </div>
  `;

  return sendEmail({ to, subject: "Welcome to Convolo! 🎉", html });
}

/* ────────────────────────── Streak Reminder ────────────────────────── */

export async function sendStreakReminder(to: string, name: string, streakDays: number) {
  const firstName = name.split(" ")[0] || "there";

  const html = `
    <div style="${baseStyles()}">
      <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">
        Don't break your ${streakDays}-day streak! 🔥
      </h1>
      <p style="font-size:16px;margin:0 0 24px;color:#4b5563;">
        Hey ${firstName}, your ${streakDays}-day streak is on the line!
      </p>

      <p style="font-size:15px;margin:0 0 16px;">
        You've been showing incredible dedication — <strong>${streakDays} days in a row</strong>!
        A single practice session today will keep your streak alive and your momentum going.
      </p>

      <p style="font-size:15px;margin:0 0 28px;color:#6b7280;">
        Remember: consistency beats intensity. Even 5 minutes counts!
      </p>

      <div style="text-align:center;">
        ${ctaButton(`${APP_URL}/dashboard`, "Keep My Streak Alive →", "#E53E3E")}
      </div>

      ${footer()}
    </div>
  `;

  return sendEmail({
    to,
    subject: `Don't break your ${streakDays}-day streak! 🔥`,
    html,
  });
}

/* ────────────────────────── Password Reset ────────────────────────── */

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
    <div style="${baseStyles()}">
      <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">Reset your password</h1>
      <p style="font-size:16px;margin:0 0 24px;color:#4b5563;">
        We received a request to reset your Convolo password.
      </p>

      <p style="font-size:15px;margin:0 0 28px;">
        Click the button below to choose a new password. This link will expire in
        <strong>1 hour</strong> for security reasons.
      </p>

      <div style="text-align:center;">
        ${ctaButton(resetUrl, "Reset My Password")}
      </div>

      <p style="font-size:13px;margin:24px 0 0;color:#9ca3af;text-align:center;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:#6C3CE1;word-break:break-all;">${resetUrl}</a>
      </p>

      <p style="font-size:13px;margin:16px 0 0;color:#9ca3af;text-align:center;">
        If you didn't request this, you can safely ignore this email — your password will stay the same.
      </p>

      ${footer()}
    </div>
  `;

  return sendEmail({ to, subject: "Reset your Convolo password", html });
}

/* ────────────────────────── Pro Upgrade Confirmation ────────────────────────── */

export async function sendProUpgradeEmail(to: string, name: string) {
  const firstName = name.split(" ")[0] || "there";

  const html = `
    <div style="${baseStyles()}">
      <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;">Welcome to Convolo Pro! 👑</h1>
      <p style="font-size:16px;margin:0 0 24px;color:#4b5563;">
        Hey ${firstName}, you've just unlocked the full Convolo experience.
      </p>

      <p style="font-size:15px;margin:0 0 16px;">
        Here's everything you now have access to:
      </p>

      <ul style="font-size:15px;margin:0 0 28px;padding-left:20px;color:#374151;">
        <li style="margin-bottom:8px;">✨ <strong>Unlimited AI conversations</strong> — practice as much as you want</li>
        <li style="margin-bottom:8px;">🎯 <strong>Advanced corrections</strong> — detailed grammar & pronunciation analysis</li>
        <li style="margin-bottom:8px;">📊 <strong>Deep progress insights</strong> — weekly reports & learning trends</li>
        <li style="margin-bottom:8px;">🧠 <strong>Spaced-repetition reviews</strong> — smart vocabulary retention</li>
        <li style="margin-bottom:8px;">🌍 <strong>All 20+ languages</strong> — switch freely between any language</li>
        <li style="margin-bottom:8px;">🏆 <strong>Exclusive achievements</strong> — Pro-only badges & milestones</li>
        <li style="margin-bottom:8px;">⚡ <strong>Priority support</strong> — faster response times from our team</li>
      </ul>

      <div style="text-align:center;">
        ${ctaButton(`${APP_URL}/dashboard`, "Explore Pro Features →", "#D97706")}
      </div>

      ${footer()}
    </div>
  `;

  return sendEmail({ to, subject: "Welcome to Convolo Pro! 👑", html });
}
