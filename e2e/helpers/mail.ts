/** Reads emails captured by MailDev (every email the app sends in tests). */
import { expect } from '@playwright/test';
import { MAILDEV } from '../env';

export interface CapturedEmail {
    id: string;
    subject: string;
    to: { address: string }[];
    from: { address: string; name: string }[];
    html: string;
    text: string;
    date: string;
}

export async function allEmails(): Promise<CapturedEmail[]> {
    const res = await fetch(`${MAILDEV.url}/api/email`);
    if (!res.ok) throw new Error(`MailDev returned ${res.status}`);
    return res.json();
}

export async function clearEmails(): Promise<void> {
    await fetch(`${MAILDEV.url}/api/email/all`, { method: 'DELETE' });
}

/** Waits for an email to `to` whose subject matches, and returns the newest one. */
export async function waitForEmail(to: string, subject: string | RegExp, timeout = 20_000): Promise<CapturedEmail> {
    let found: CapturedEmail | undefined;
    await expect.poll(async () => {
        const emails = await allEmails();
        found = emails
            .filter(e => e.to.some(t => t.address.toLowerCase() === to.toLowerCase()))
            .filter(e => (typeof subject === 'string' ? e.subject.includes(subject) : subject.test(e.subject)))
            .sort((a, b) => b.date.localeCompare(a.date))[0];
        return !!found;
    }, { timeout, message: `email to ${to} with subject ${subject}` }).toBe(true);
    return found!;
}

/** First link in the email's HTML that matches (HTML entities decoded). */
export function linkIn(email: CapturedEmail, pattern: RegExp): string {
    const hrefs = [...email.html.matchAll(/href="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
    const href = hrefs.find(h => pattern.test(h));
    if (!href) throw new Error(`No link matching ${pattern} in "${email.subject}"`);
    return href;
}
