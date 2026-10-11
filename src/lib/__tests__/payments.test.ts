import {
    buildCheckoutPaymentOptions,
    getAvailablePaymentMethods,
    getPaymentDetails,
    isPaymentMethodAvailable,
    normalizePaymentSettings,
} from '../payments';

const configured = normalizePaymentSettings({
    cod: { enabled: true },
    bank_transfer: {
        enabled: true,
        bank_name: ' Meezan Bank ',
        account_title: 'Closet By Era',
        account_number: '0101-0101010',
        iban: 'pk00mezn0000000000000000',
    },
    jazzcash: { enabled: true, account_title: 'Closet By Era', account_number: '0300-0000000' },
    easypaisa: { enabled: false, account_title: 'Closet By Era', account_number: '0345-0000000' },
});

describe('normalizePaymentSettings', () => {
    it('reads the legacy { cod, stripe } shape as COD only', () => {
        const settings = normalizePaymentSettings({ cod: true, stripe: true });
        expect(getAvailablePaymentMethods(settings)).toEqual(['cod']);
    });

    it('defaults to COD when nothing is stored', () => {
        expect(getAvailablePaymentMethods(normalizePaymentSettings(null))).toEqual(['cod']);
        expect(getAvailablePaymentMethods(normalizePaymentSettings('garbage'))).toEqual(['cod']);
    });

    it('respects COD being switched off', () => {
        expect(normalizePaymentSettings({ cod: false }).cod.enabled).toBe(false);
        expect(normalizePaymentSettings({ cod: { enabled: false } }).cod.enabled).toBe(false);
    });

    it('trims text, upper-cases the IBAN and ignores non-string values', () => {
        expect(configured.bank_transfer.bank_name).toBe('Meezan Bank');
        expect(configured.bank_transfer.iban).toBe('PK00MEZN0000000000000000');
        const odd = normalizePaymentSettings({ jazzcash: { enabled: 'yes', account_number: 42 } });
        expect(odd.jazzcash).toEqual({ enabled: false, account_title: '', account_number: '' });
    });
});

describe('isPaymentMethodAvailable', () => {
    it('offers enabled methods whose account details are complete', () => {
        expect(getAvailablePaymentMethods(configured)).toEqual(['cod', 'bank_transfer', 'jazzcash']);
    });

    it('hides an enabled transfer method with missing details', () => {
        const settings = normalizePaymentSettings({ easypaisa: { enabled: true, account_title: 'Closet By Era' } });
        expect(isPaymentMethodAvailable(settings, 'easypaisa')).toBe(false);
    });

    it('accepts a bank account given by IBAN alone', () => {
        const settings = normalizePaymentSettings({
            bank_transfer: { enabled: true, bank_name: 'HBL', account_title: 'Closet By Era', iban: 'PK00' },
        });
        expect(isPaymentMethodAvailable(settings, 'bank_transfer')).toBe(true);
    });
});

describe('getPaymentDetails', () => {
    it('lists only filled-in fields', () => {
        const settings = normalizePaymentSettings({
            bank_transfer: { enabled: true, bank_name: 'HBL', account_title: 'Closet By Era', account_number: '123' },
        });
        expect(getPaymentDetails(settings, 'bank_transfer')).toEqual([
            { label: 'Bank', value: 'HBL' },
            { label: 'Account title', value: 'Closet By Era' },
            { label: 'Account number', value: '123' },
        ]);
    });

    it('has nothing to show for COD', () => {
        expect(getPaymentDetails(configured, 'cod')).toEqual([]);
    });
});

describe('buildCheckoutPaymentOptions', () => {
    it('never exposes details of methods that are not offered', () => {
        const options = buildCheckoutPaymentOptions(configured, { whatsappNumber: null, supportEmail: 'help@example.com' });
        expect(options.methods).toEqual(['cod', 'bank_transfer', 'jazzcash']);
        expect(Object.keys(options.details)).toEqual(['cod', 'bank_transfer', 'jazzcash']);
        expect(options.details.easypaisa).toBeUndefined();
    });
});
