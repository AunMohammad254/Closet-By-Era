'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';

export type CurrencyCode = 'PKR' | 'USD' | 'GBP' | 'EUR' | 'AED';

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    convertPrice: (amountInPKR: number) => number;
    formatPrice: (amountInPKR: number) => string;
    symbol: string;
}

// Approximate Static Rates (Base is PKR)
const RATES: Record<CurrencyCode, number> = {
    PKR: 1,
    USD: 0.0036,
    GBP: 0.0028,
    EUR: 0.0033,
    AED: 0.0132
};

const SYMBOLS: Record<CurrencyCode, string> = {
    PKR: 'PKR',
    USD: '$',
    GBP: '£',
    EUR: '€',
    AED: 'AED'
};

function formatIn(currency: CurrencyCode, amountInPKR: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: currency === 'PKR' ? 0 : 2,
        maximumFractionDigits: currency === 'PKR' ? 0 : 2,
    }).format(amountInPKR * RATES[currency]);
}

/** Orders are always charged in PKR; use this where the exact charge must be shown. */
export const formatPKR = (amountInPKR: number) => formatIn('PKR', amountInPKR);

// Outside a provider (tests, isolated renders) prices stay in PKR.
const CurrencyContext = createContext<CurrencyContextType>({
    currency: 'PKR',
    setCurrency: () => {},
    convertPrice: (amountInPKR) => amountInPKR,
    formatPrice: formatPKR,
    symbol: SYMBOLS.PKR,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<CurrencyCode>('PKR');

    useEffect(() => {
        const stored = localStorage.getItem('currency');
        if (stored && RATES[stored as CurrencyCode]) {
            // eslint-disable-next-line
            setCurrency(stored as CurrencyCode);
        }
    }, []);

    const handleSetCurrency = useCallback((code: CurrencyCode) => {
        setCurrency(code);
        localStorage.setItem('currency', code);
    }, []);

    const convertPrice = useCallback((amountInPKR: number) => {
        return amountInPKR * RATES[currency];
    }, [currency]);

    const formatPrice = useCallback((amountInPKR: number) => formatIn(currency, amountInPKR), [currency]);

    const contextValue = useMemo(() => ({
        currency,
        setCurrency: handleSetCurrency,
        convertPrice,
        formatPrice,
        symbol: SYMBOLS[currency]
    }), [currency, handleSetCurrency, convertPrice, formatPrice]);

    return (
        <CurrencyContext.Provider value={contextValue}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}
