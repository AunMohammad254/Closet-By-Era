import { parseShippingAddress } from '../order-display';

describe('parseShippingAddress', () => {
    it('returns the object if raw is a valid object', () => {
        const addr = { firstName: 'John', lastName: 'Doe', city: 'New York' };
        expect(parseShippingAddress(addr)).toEqual(addr);
    });

    it('returns empty object if raw is empty string or spaces', () => {
        expect(parseShippingAddress('')).toEqual({});
        expect(parseShippingAddress('   ')).toEqual({});
    });

    it('returns empty object if raw is null or undefined or a number', () => {
        expect(parseShippingAddress(null)).toEqual({});
        expect(parseShippingAddress(undefined)).toEqual({});
        expect(parseShippingAddress(123)).toEqual({});
        expect(parseShippingAddress(true)).toEqual({});
    });

    it('returns parsed object if raw is a valid JSON string object', () => {
        const addr = { firstName: 'Jane', lastName: 'Smith', city: 'London' };
        expect(parseShippingAddress(JSON.stringify(addr))).toEqual(addr);
    });

    it('returns fallback object if raw is a valid JSON string but not an object', () => {
        // e.g. a JSON string that is just a primitive or an array
        const rawPrimitive = '"just a string"';
        expect(parseShippingAddress(rawPrimitive)).toEqual({ address: rawPrimitive });

        const rawArray = '["array", "of", "strings"]';
        expect(parseShippingAddress(rawArray)).toEqual({ address: rawArray });
    });

    it('returns fallback object with legacy free-text address if raw is invalid JSON', () => {
        const raw = '123 Main St, Springfield, IL 62701';
        expect(parseShippingAddress(raw)).toEqual({ address: raw });
    });
});
