/** @jest-environment node */
jest.mock('server-only', () => ({}));

const sendMail = jest.fn();
jest.mock('nodemailer', () => ({
    __esModule: true,
    default: {
        createTransport: (options: { host: string }) => ({
            sendMail: (message: unknown) => sendMail(options.host, message),
        }),
    },
}));

const message = { to: 'shopper@example.com', subject: 'Hello', html: '<p>Hi</p>', text: 'Hi' };

describe('sendEmail', () => {
    const env = process.env;

    beforeEach(() => {
        jest.resetModules();
        sendMail.mockReset();
        process.env = {
            ...env,
            BREVO_SMTP_LOGIN: 'login@smtp-brevo.com',
            BREVO_SMTP_KEY: 'brevo-key',
            RESEND_API_KEY: 're_test',
            EMAIL_FROM: 'orders@shop.example',
            EMAIL_FROM_NAME: 'Shop',
        };
        delete process.env.EMAIL_PROVIDERS;
        delete process.env.SMTP_HOST;
    });

    afterAll(() => { process.env = env; });

    const load = () => import('../transport');

    it('uses Brevo first', async () => {
        sendMail.mockResolvedValue({ messageId: 'm1' });
        const result = await (await load()).sendEmail(message);
        expect(result).toMatchObject({ success: true, provider: 'brevo' });
        expect(sendMail).toHaveBeenCalledWith('smtp-relay.brevo.com', expect.objectContaining({
            to: 'shopper@example.com',
            from: { name: 'Shop', address: 'orders@shop.example' },
        }));
    });

    it('falls back to Resend when Brevo fails', async () => {
        sendMail.mockImplementation(async (host: string) => {
            if (host === 'smtp-relay.brevo.com') throw new Error('Brevo is down');
            return { messageId: 'm2' };
        });
        const result = await (await load()).sendEmail(message);
        expect(result).toMatchObject({ success: true, provider: 'resend' });
        expect(sendMail.mock.calls.map(c => c[0])).toEqual(['smtp-relay.brevo.com', 'smtp.resend.com']);
    });

    it('follows EMAIL_PROVIDERS order and skips unconfigured providers', async () => {
        process.env.EMAIL_PROVIDERS = 'smtp,resend,brevo';
        sendMail.mockResolvedValue({ messageId: 'm3' });
        const transport = await load();
        expect(transport.getEmailProviders()).toEqual(['resend', 'brevo']);
        await expect(transport.sendEmail(message)).resolves.toMatchObject({ provider: 'resend' });
    });

    it('reports failure when every provider fails', async () => {
        sendMail.mockRejectedValue(new Error('nope'));
        const result = await (await load()).sendEmail(message);
        expect(result.success).toBe(false);
        expect(result.error).toContain('brevo: nope');
        expect(result.error).toContain('resend: nope');
    });

    it('does nothing without any provider', async () => {
        delete process.env.BREVO_SMTP_LOGIN;
        delete process.env.RESEND_API_KEY;
        const result = await (await load()).sendEmail(message);
        expect(result).toEqual({ success: false, error: 'No email provider configured' });
        expect(sendMail).not.toHaveBeenCalled();
    });
});
