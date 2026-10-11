/**
 * The one email design used for every message (orders, account emails,
 * security notices). Build bodies from the blocks below; never use a
 * provider's own templates, so any SMTP provider renders the same email.
 *
 * Inline styles and tables only: email clients ignore <style> and flexbox.
 */
import { getSiteUrl } from '@/lib/site-url';

const BRAND = {
    name: 'Closet By Era',
    ink: '#0f172a',
    text: '#334155',
    muted: '#64748b',
    accent: '#e11d48',
    surface: '#ffffff',
    page: '#f1f5f9',
    soft: '#f8fafc',
    border: '#e2e8f0',
    font: "'Segoe UI', Helvetica, Arial, sans-serif",
};

/** Escape text before interpolating it into email HTML. */
export function esc(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// --- Blocks (each returns trusted HTML; arguments are escaped) -------------

export const heading = (text: string) =>
    `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND.ink};font-weight:700;">${esc(text)}</h1>`;

export const subheading = (text: string) =>
    `<h2 style="margin:28px 0 12px;font-size:16px;color:${BRAND.ink};font-weight:600;">${esc(text)}</h2>`;

export const paragraph = (text: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">${esc(text)}</p>`;

/** Paragraph with pre-built inline HTML (caller escapes any user data). */
export const richParagraph = (html: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">${html}</p>`;

export const strong = (text: string) => `<strong style="color:${BRAND.ink};">${esc(text)}</strong>`;

export function button(href: string, label: string): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr>
<td style="border-radius:999px;background:${BRAND.accent};">
<a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(label)}</a>
</td></tr></table>`;
}

/** Fallback link under a button, for clients that block buttons. */
export const linkFallback = (href: string) =>
    `<p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">If the button does not work, open this link:<br><a href="${esc(href)}" style="color:${BRAND.accent};">${esc(href)}</a></p>`;

export const code = (value: string) =>
    `<p style="margin:8px 0 24px;font-size:30px;letter-spacing:8px;font-weight:700;color:${BRAND.ink};font-family:Consolas,Menlo,monospace;">${esc(value)}</p>`;

export const note = (text: string) =>
    `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${BRAND.muted};">${esc(text)}</p>`;

/** Highlighted box, e.g. payment instructions or a security warning. */
export const callout = (innerHtml: string, tone: 'info' | 'warning' = 'info') => {
    const [bg, border] = tone === 'warning' ? ['#fff7ed', '#fed7aa'] : [BRAND.soft, BRAND.border];
    return `<div style="margin:0 0 24px;padding:16px 20px;background:${bg};border:1px solid ${border};border-radius:10px;">${innerHtml}</div>`;
};

/** Two-column label/value rows; set `emphasis` on a row to bold it. */
export function details(rows: { label: string; value: string; emphasis?: boolean }[]): string {
    const body = rows.map(r => {
        const weight = r.emphasis ? `font-weight:700;font-size:16px;color:${BRAND.ink};` : `color:${BRAND.ink};`;
        return `<tr>
<td style="padding:6px 0;font-size:14px;color:${BRAND.muted};">${esc(r.label)}</td>
<td style="padding:6px 0;font-size:14px;text-align:right;${weight}">${esc(r.value)}</td>
</tr>`;
    }).join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">${body}</table>`;
}

/** Item table: name (with optional detail line), quantity, price. */
export function itemTable(items: { name: string; detail?: string; quantity: number; price: string }[]): string {
    const head = ['Item', 'Qty', 'Price'].map((h, i) =>
        `<th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${BRAND.muted};text-align:${['left', 'center', 'right'][i]};background:${BRAND.soft};">${h}</th>`
    ).join('');
    const rows = items.map(item => `<tr>
<td style="padding:12px;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.ink};">${esc(item.name)}${item.detail ? `<br><span style="font-size:12px;color:${BRAND.muted};">${esc(item.detail)}</span>` : ''}</td>
<td style="padding:12px;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.text};text-align:center;">${item.quantity}</td>
<td style="padding:12px;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.ink};text-align:right;">${esc(item.price)}</td>
</tr>`).join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

// --- Page ------------------------------------------------------------------

export interface LayoutOptions {
    /** Inbox preview text (hidden in the body). */
    preheader: string;
    /** Body HTML built from the blocks above. */
    body: string;
}

export function renderEmail({ preheader, body }: LayoutOptions): string {
    const site = getSiteUrl();
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(BRAND.name)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};font-family:${BRAND.font};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="background:${BRAND.ink};padding:28px 32px;border-radius:14px 14px 0 0;text-align:center;">
<a href="${esc(site)}" style="text-decoration:none;font-size:22px;font-weight:700;letter-spacing:3px;color:#ffffff;">CLOSET<span style="color:${BRAND.accent};">BY</span>ERA</a>
</td></tr>
<tr><td style="background:${BRAND.surface};padding:36px 32px;border-radius:0 0 14px 14px;">
${body}
</td></tr>
<tr><td style="padding:24px 16px;text-align:center;font-size:12px;line-height:1.6;color:${BRAND.muted};">
<a href="${esc(site)}" style="color:${BRAND.muted};">${esc(site.replace(/^https?:\/\//, ''))}</a><br>
&copy; ${year} ${esc(BRAND.name)}. All rights reserved.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
