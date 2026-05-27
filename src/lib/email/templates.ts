interface BaseLayoutOpts {
  preheader: string;
  title: string;
  bodyHtml: string;
  bodyText: string;
  cta?: { label: string; href: string };
  origin: string;
}

const FG = "#1d1714";
const MUTED = "#7a6a5c";
const ACCENT = "#c97a3b";
const BG = "#f7f3ec";
const BORDER = "#e7dccd";

function baseLayout({
  preheader,
  title,
  bodyHtml,
  cta,
  origin,
}: BaseLayoutOpts): string {
  const ctaButton = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
        <tr>
          <td>
            <a href="${cta.href}" style="display:inline-block;padding:12px 22px;background:${FG};color:${BG};text-decoration:none;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;border-radius:4px;">${cta.label}</a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};color:${FG};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:32px 36px;background:#fff;border:1px solid ${BORDER};border-radius:6px;">
                <div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:${ACCENT};letter-spacing:0.04em;text-transform:uppercase;margin-bottom:18px;">runebook</div>
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:500;color:${FG};line-height:1.3;">${title}</h1>
                <div style="font-size:15px;line-height:1.6;color:${FG};">${bodyHtml}</div>
                ${ctaButton}
                <div style="margin-top:32px;padding-top:18px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED};line-height:1.6;">
                  Sent by Runebook · <a href="${origin}" style="color:${MUTED};">${origin.replace(/^https?:\/\//, "")}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function plainLayout(opts: BaseLayoutOpts): string {
  const cta = opts.cta ? `\n\n${opts.cta.label}: ${opts.cta.href}` : "";
  return `${opts.title}\n\n${opts.bodyText}${cta}\n\n--\nRunebook · ${opts.origin}\n`;
}

interface OrgInviteOpts {
  origin: string;
  orgName: string;
  orgDisplayName: string;
  inviterName: string;
  roleName: string;
  inviteUrl: string;
}

export function orgInviteEmail(opts: OrgInviteOpts) {
  const { orgName, orgDisplayName, inviterName, roleName, inviteUrl, origin } =
    opts;
  const title = `${inviterName} invited you to ${orgDisplayName}`;
  const bodyHtml = `<p style="margin:0 0 12px;">You've been invited to join <strong>${orgDisplayName}</strong> (<code>@${orgName}</code>) on Runebook as a <strong>${roleName}</strong>.</p>
<p style="margin:0;">Click the button below to accept. If you don't have a Runebook account yet, you'll be prompted to sign in with GitHub first.</p>`;
  const bodyText = `You've been invited to join ${orgDisplayName} (@${orgName}) on Runebook as a ${roleName}.\n\nVisit the link below to accept. If you don't have a Runebook account yet, you'll be prompted to sign in with GitHub first.`;
  const opts2 = {
    preheader: `Join ${orgDisplayName} on Runebook as a ${roleName}.`,
    title,
    bodyHtml,
    bodyText,
    cta: { label: "Accept invitation", href: inviteUrl },
    origin,
  };
  return {
    subject: `Invitation to join ${orgDisplayName} on Runebook`,
    html: baseLayout(opts2),
    text: plainLayout(opts2),
  };
}

interface SimpleOpts {
  origin: string;
  title: string;
  bodyHtml: string;
  bodyText: string;
  cta?: { label: string; href: string };
  preheader?: string;
}

/** Generic notification email — used for in-app notifications echoed to email. */
export function notificationEmail(opts: SimpleOpts) {
  const opts2 = {
    preheader: opts.preheader ?? opts.title,
    title: opts.title,
    bodyHtml: opts.bodyHtml,
    bodyText: opts.bodyText,
    cta: opts.cta,
    origin: opts.origin,
  };
  return {
    subject: opts.title,
    html: baseLayout(opts2),
    text: plainLayout(opts2),
  };
}
