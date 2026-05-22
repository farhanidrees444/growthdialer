import type { Role } from '@/lib/auth/permissions';
import { ROLE_LABELS } from '@/lib/auth/permissions';

interface InvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: Role;
  message?: string;
  token: string;
}

interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function buildInviteUrl(token: string): string {
  const base = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.growthdialer.ai';
  return `${base}/accept-invite/${token}`;
}

function buildHtmlEmail(params: InvitationEmailParams & { inviteUrl: string }): string {
  const { inviterName, workspaceName, role, message, inviteUrl } = params;
  const roleLabel = ROLE_LABELS[role] ?? role;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're invited to ${workspaceName}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

      <!-- Logo -->
      <tr><td style="padding-bottom:32px;text-align:center;">
        <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">
          <span style="color:#ffffff;">Growth</span><span style="color:#34d399;">Dialer</span>
        </span>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 36px;">

        <!-- Invite badge -->
        <div style="display:inline-block;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25);border-radius:100px;padding:5px 14px;margin-bottom:24px;">
          <span style="color:#34d399;font-size:12px;font-weight:600;letter-spacing:0.5px;">WORKSPACE INVITATION</span>
        </div>

        <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 10px;line-height:1.3;">
          You're invited to join<br /><span style="color:#34d399;">${workspaceName}</span>
        </h1>

        <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
          <strong style="color:#e2e8f0;">${inviterName}</strong> has invited you to collaborate on
          <strong style="color:#e2e8f0;">${workspaceName}</strong> as a
          <strong style="color:#e2e8f0;">${roleLabel}</strong>.
        </p>

        ${message ? `
        <!-- Personal message -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="color:#94a3b8;font-size:13px;font-style:italic;margin:0;">"${message}"</p>
          <p style="color:#64748b;font-size:12px;margin:8px 0 0;">— ${inviterName}</p>
        </div>
        ` : ''}

        <!-- Role badge -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;margin-bottom:28px;">
          <p style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;margin:0 0 4px;text-transform:uppercase;">Your Role</p>
          <p style="color:#e2e8f0;font-size:15px;font-weight:600;margin:0;">${roleLabel}</p>
        </div>

        <!-- CTA button -->
        <a href="${inviteUrl}" style="display:block;background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;padding:16px 24px;text-align:center;text-decoration:none;margin-bottom:20px;">
          <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.2px;">Accept Invitation →</span>
        </a>

        <!-- Expiry note -->
        <p style="color:#475569;font-size:12px;text-align:center;margin:0 0 24px;">This invitation expires in 7 days</p>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;" />

        <!-- URL fallback -->
        <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;">
          If the button above doesn't work, copy and paste this URL into your browser:
        </p>
        <p style="color:#34d399;font-size:12px;word-break:break-all;margin:8px 0 0;">${inviteUrl}</p>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 8px;text-align:center;">
        <p style="color:#334155;font-size:11px;margin:0;">
          This email was sent by GrowthDialer on behalf of ${inviterName}.
          If you weren't expecting this, you can safely ignore it.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[email] RESEND_API_KEY not set — invitation email skipped');
    return { ok: false, error: 'Email service not configured' };
  }

  const inviteUrl = buildInviteUrl(params.token);
  const html = buildHtmlEmail({ ...params, inviteUrl });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'GrowthDialer <noreply@growthdialer.ai>',
        to: [params.to],
        subject: `${params.inviterName} invited you to ${params.workspaceName} on GrowthDialer`,
        html,
      }),
    });

    const data = await res.json() as { id?: string; message?: string; name?: string };
    if (!res.ok) {
      console.error('[email] Resend error:', data);
      return { ok: false, error: data.message ?? 'Email failed to send' };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[email] Exception:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
