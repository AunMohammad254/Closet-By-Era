import { details, itemTable, callout, renderEmail } from '../layout';

describe('email layout', () => {
    describe('details', () => {
        it('renders two-column table with labels and values', () => {
            const html = details([
                { label: 'Order Number', value: 'CBE-123456' },
                { label: 'Total', value: 'PKR 5,000', emphasis: true },
            ]);
            expect(html).toContain('Order Number');
            expect(html).toContain('CBE-123456');
            expect(html).toContain('PKR 5,000');
            expect(html).toContain('font-weight:700');
        });
    });

    describe('itemTable', () => {
        it('renders item table with details, quantity, and price', () => {
            const html = itemTable([
                { name: 'Oxford Shirt', detail: 'Size: L • Color: Blue', quantity: 2, price: 'PKR 7,000' },
                { name: 'Leather Belt', quantity: 1, price: 'PKR 2,990' },
            ]);
            expect(html).toContain('Oxford Shirt');
            expect(html).toContain('Size: L • Color: Blue');
            expect(html).toContain('Leather Belt');
            expect(html).toContain('PKR 7,000');
            expect(html).toContain('PKR 2,990');
        });
    });

    describe('callout', () => {
        it('renders callout with info and warning tones', () => {
            const infoHtml = callout('Important information', 'info');
            expect(infoHtml).toContain('Important information');

            const warnHtml = callout('Security warning', 'warning');
            expect(warnHtml).toContain('Security warning');
            expect(warnHtml).toContain('#fff7ed');
        });
    });

    describe('renderEmail', () => {
        it('wraps preheader and body in full HTML document', () => {
            const output = renderEmail({
                preheader: 'Your order has been confirmed',
                body: '<p>Thank you for shopping with us!</p>',
            });
            expect(output).toContain('<!DOCTYPE html>');
            expect(output).toContain('Your order has been confirmed');
            expect(output).toContain('Thank you for shopping with us!');
            expect(output).toContain('Closet By Era');
        });
    });
});
