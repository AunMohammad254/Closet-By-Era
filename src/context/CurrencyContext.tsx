'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type CurrencyCode = 'PKR' | 'USD' | 'GBP' | 'EUR' | 'AED';

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    convertPrice: (amountInPKR: number) => number;
    formatPrice: (amountInPKR: number) => string;
    symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

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

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<CurrencyCode>('PKR');

    useEffect(() => {
        const stored = localStorage.getItem('currency');
        if (stored && RATES[stored as CurrencyCode]) {
            // eslint-disable-next-line
            setCurrency(stored as CurrencyCode);
        }
    }, []);

    const handleSetCurrency = (code: CurrencyCode) => {
        setCurrency(code);
        localStorage.setItem('currency', code);
    };

    const convertPrice = (amountInPKR: number) => {
        return amountInPKR * RATES[currency];
    };

    const formatPrice = (amountInPKR: number) => {
        const converted = convertPrice(amountInPKR);
        const symbol = SYMBOLS[currency];

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'PKR' ? 0 : 2,
            maximumFractionDigits: currency === 'PKR' ? 0 : 2,
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency: handleSetCurrency,
            convertPrice,
            formatPrice,
            symbol: SYMBOLS[currency]
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
