import { isSameSitePath } from '../safe-path';

describe('isSameSitePath', () => {
    it.each(['/', '/account', '/account?tab=orders', '/products/a-b#reviews'])('accepts %s', (path) => {
        expect(isSameSitePath(path)).toBe(true);
    });

    it.each(['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', 'account', '', null, undefined])(
        'rejects %p',
        (path) => {
            expect(isSameSitePath(path)).toBe(false);
        }
    );
});
