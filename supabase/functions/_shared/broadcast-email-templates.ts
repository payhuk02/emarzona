/**
 * Gabarits email premium pour envois admin
 */
export type BroadcastEmailDesign = 'classic' | 'premium' | 'announcement' | 'minimal';

interface WrapOptions {
  title: string;
  bodyHtml: string;
  recipientName: string;
  actionUrl?: string;
  actionLabel?: string;
  design?: BroadcastEmailDesign;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function actionBlock(actionUrl?: string, actionLabel?: string, accent = '#6366f1'): string {
  if (!actionUrl?.trim() || !actionLabel?.trim()) return '';
  const safeUrl = escapeHtml(actionUrl.trim());
  const safeLabel = escapeHtml(actionLabel.trim());
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td style="border-radius:8px;background:${accent};">
          <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${safeLabel}</a>
        </td>
      </tr>
    </table>`;
}

function footerBlock(): string {
  return `
    <p style="margin:32px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;text-align:center;">
      Cordialement,<br><strong style="color:#64748b;">L'équipe Emarzona</strong>
    </p>
    <p style="margin:16px 0 0;font-size:11px;color:#cbd5e1;text-align:center;">
      © ${new Date().getFullYear()} Emarzona · Plateforme e-commerce
    </p>`;
}

export function wrapBroadcastEmailHtml(options: WrapOptions): string {
  const design = options.design || 'premium';
  const title = escapeHtml(options.title);
  const greeting = escapeHtml(options.recipientName);
  const body = options.bodyHtml;
  const action = actionBlock(options.actionUrl, options.actionLabel);

  if (design === 'minimal') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;font-family:Georgia,'Times New Roman',serif;background:#fafafa;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:4px;">
    <p style="margin:0 0 16px;font-size:15px;">Bonjour ${greeting},</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;">${title}</h1>
    <div style="font-size:15px;line-height:1.7;color:#334155;">${body}</div>
    ${action}
    ${footerBlock()}
  </div>
</body></html>`;
  }

  if (design === 'classic') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 16px;border-bottom:3px solid #3b82f6;">
          <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Bonjour ${greeting},</p>
          <h1 style="margin:0;font-size:24px;color:#0f172a;">${title}</h1>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;font-size:15px;line-height:1.65;color:#334155;">${body}${action}${footerBlock()}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  if (design === 'announcement') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:0 0 24px;text-align:center;">
          <span style="display:inline-block;padding:6px 14px;background:rgba(99,102,241,0.2);color:#a5b4fc;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;border-radius:20px;">Annonce plateforme</span>
        </td></tr>
        <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#db2777 100%);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;line-height:1.3;">${title}</h1>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;font-size:15px;line-height:1.7;color:#334155;">
          <p style="margin:0 0 16px;color:#64748b;">Bonjour <strong style="color:#0f172a;">${greeting}</strong>,</p>
          <div>${body}</div>
          ${actionBlock(options.actionUrl, options.actionLabel, '#7c3aed')}
          ${footerBlock()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  // premium (default)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#eef2ff 0%,#f8fafc 120px);padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 32px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.85);letter-spacing:0.06em;text-transform:uppercase;">Emarzona</p>
          <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;line-height:1.35;">${title}</h1>
        </td></tr>
        <tr><td style="padding:32px;font-size:15px;line-height:1.7;color:#334155;">
          <p style="margin:0 0 20px;font-size:15px;color:#64748b;">Bonjour <strong style="color:#0f172a;">${greeting}</strong>,</p>
          <div style="color:#334155;">${body}</div>
          ${actionBlock(options.actionUrl, options.actionLabel, '#6366f1')}
          ${footerBlock()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
