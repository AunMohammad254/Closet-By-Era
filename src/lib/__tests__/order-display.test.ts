import {
    parseShippingAddress,
    getOrderCustomerName,
    getOrderCustomerEmail,
    toCsvCell,
} from '../order-display';

describe('order-display helpers', () => {
    describe('parseShippingAddress', () => {
        it('returns the object directly if raw is an object', () => {
            const raw = { address: '123 Main St' };
            expect(parseShippingAddress(raw)).toEqual({ address: '123 Main St' });
        });

        it('returns an empty object if raw is not a string or is empty', () => {
            expect(parseShippingAddress(null)).toEqual({});
            expect(parseShippingAddress(123)).toEqual({});
            expect(parseShippingAddress('')).toEqual({});
            expect(parseShippingAddress('   ')).toEqual({});
        });

        it('returns parsed object if raw is a valid JSON object string', () => {
            const raw = JSON.stringify({ firstName: 'John', lastName: 'Doe' });
            expect(parseShippingAddress(raw)).toEqual({ firstName: 'John', lastName: 'Doe' });
        });

        it('returns a fallback object if raw is a valid JSON string that evaluates to non-object', () => {
            const raw = JSON.stringify('123 Main St');
            expect(parseShippingAddress(raw)).toEqual({ address: '"123 Main St"' });
        });

        it('returns a fallback object if raw is an invalid JSON string', () => {
            const raw = '123 Main St, Springfield';
            expect(parseShippingAddress(raw)).toEqual({ address: '123 Main St, Springfield' });
        });
    });

    describe('getOrderCustomerName', () => {
        it('returns customer_name from order if it exists', () => {
            const order = { customer_name: '  Alice Bob  ' };
            expect(getOrderCustomerName(order)).toBe('Alice Bob');
        });

        it('returns from customer object first_name and last_name if customer_name is missing', () => {
            const order = { customer: { first_name: 'Charlie', last_name: 'Doe' } };
            expect(getOrderCustomerName(order)).toBe('Charlie Doe');
        });

        it('returns from customers object if customer is missing', () => {
            const order = { customers: { first_name: 'David', last_name: 'Smith' } };
            expect(getOrderCustomerName(order)).toBe('David Smith');
        });

        it('returns from shipping_address if order/customer names are missing', () => {
            const order = { shipping_address: JSON.stringify({ firstName: 'Eve', lastName: 'Johnson' }) };
            expect(getOrderCustomerName(order)).toBe('Eve Johnson');
        });

        it('returns customer email if names are missing', () => {
            const order = { customer: { email: 'test@example.com' } };
            expect(getOrderCustomerName(order)).toBe('test@example.com');
        });

        it('returns order.customer_email if names and customer email are missing', () => {
            const order = { customer_email: 'order@example.com' };
            expect(getOrderCustomerName(order)).toBe('order@example.com');
        });

        it('returns Guest as fallback', () => {
            const order = {};
            expect(getOrderCustomerName(order)).toBe('Guest');
        });
    });

    describe('getOrderCustomerEmail', () => {
        it('returns order.customer_email with highest priority', () => {
            const order = {
                customer_email: 'order@example.com',
                customer: { email: 'customer@example.com' },
                shipping_address: JSON.stringify({ email: 'shipping@example.com' })
            };
            expect(getOrderCustomerEmail(order)).toBe('order@example.com');
        });

        it('returns customer email if order.customer_email is missing', () => {
            const order = {
                customer: { email: 'customer@example.com' },
                shipping_address: JSON.stringify({ email: 'shipping@example.com' })
            };
            expect(getOrderCustomerEmail(order)).toBe('customer@example.com');
        });

        it('returns customers email if order.customer_email and customer is missing', () => {
            const order = {
                customers: { email: 'customers@example.com' },
                shipping_address: JSON.stringify({ email: 'shipping@example.com' })
            };
            expect(getOrderCustomerEmail(order)).toBe('customers@example.com');
        });

        it('returns shipping_address email if others are missing', () => {
            const order = {
                shipping_address: JSON.stringify({ email: 'shipping@example.com' })
            };
            expect(getOrderCustomerEmail(order)).toBe('shipping@example.com');
        });

        it('returns empty string as fallback', () => {
            const order = {};
            expect(getOrderCustomerEmail(order)).toBe('');
        });
    });

    describe('toCsvCell', () => {
        it('wraps regular text in quotes', () => {
            expect(toCsvCell('hello')).toBe('"hello"');
        });

        it('escapes double quotes in text', () => {
            expect(toCsvCell('he said "hello"')).toBe('"he said ""hello"""');
        });

        it('neutralises formula starting with =', () => {
            expect(toCsvCell('=1+1')).toBe('"' + "'" + '=1+1"');
        });

        it('neutralises formula starting with +', () => {
            expect(toCsvCell('+1+1')).toBe('"' + "'" + '+1+1"');
        });

        it('neutralises formula starting with -', () => {
            expect(toCsvCell('-1+1')).toBe('"' + "'" + '-1+1"');
        });

        it('neutralises formula starting with @', () => {
            expect(toCsvCell('@SUM(A1:A2)')).toBe('"' + "'" + '@SUM(A1:A2)"');
        });

        it('handles null or undefined values', () => {
            expect(toCsvCell(null)).toBe('""');
            expect(toCsvCell(undefined)).toBe('""');
        });

        it('handles numbers', () => {
            expect(toCsvCell(123)).toBe('"123"');
        });
    });
});
