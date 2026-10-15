import { saveCheckoutCode, takeCheckoutCode } from '../checkout-code';

describe('checkout-code', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('saves and retrieves code from sessionStorage', () => {
        saveCheckoutCode('TESTCODE10');
        expect(takeCheckoutCode()).toBe('TESTCODE10');
        // Once taken, it is removed from storage
        expect(takeCheckoutCode()).toBeNull();
    });

    it('returns null if no code was saved', () => {
        expect(takeCheckoutCode()).toBeNull();
    });

    it('gracefully handles sessionStorage failure', () => {
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Quota exceeded');
        });
        const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Access denied');
        });

        expect(() => saveCheckoutCode('CODE')).not.toThrow();
        expect(takeCheckoutCode()).toBeNull();

        setItemSpy.mockRestore();
        getItemSpy.mockRestore();
    });
});
