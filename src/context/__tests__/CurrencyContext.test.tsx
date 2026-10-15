import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyProvider, useCurrency, formatPKR } from '../CurrencyContext';

function TestCurrencyComponent() {
    const { currency, setCurrency, convertPrice, formatPrice, symbol } = useCurrency();

    return (
        <div>
            <span data-testid="currency">{currency}</span>
            <span data-testid="symbol">{symbol}</span>
            <span data-testid="converted">{convertPrice(10000)}</span>
            <span data-testid="formatted">{formatPrice(10000)}</span>
            <button onClick={() => setCurrency('USD')}>Set USD</button>
            <button onClick={() => setCurrency('EUR')}>Set EUR</button>
            <button onClick={() => setCurrency('PKR')}>Set PKR</button>
        </div>
    );
}

describe('CurrencyContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('formats PKR properly with formatPKR', () => {
        expect(formatPKR(5000)).toMatch(/^PKR\s5,000$/);
    });

    it('defaults to PKR and reads saved currency from localStorage', () => {
        localStorage.setItem('currency', 'USD');
        render(
            <CurrencyProvider>
                <TestCurrencyComponent />
            </CurrencyProvider>
        );

        expect(screen.getByTestId('currency')).toHaveTextContent('USD');
        expect(screen.getByTestId('symbol')).toHaveTextContent('$');
    });

    it('switches currencies and updates converted/formatted values and localStorage', () => {
        render(
            <CurrencyProvider>
                <TestCurrencyComponent />
            </CurrencyProvider>
        );

        expect(screen.getByTestId('currency')).toHaveTextContent('PKR');

        fireEvent.click(screen.getByText('Set USD'));
        expect(screen.getByTestId('currency')).toHaveTextContent('USD');
        expect(localStorage.getItem('currency')).toBe('USD');
        expect(screen.getByTestId('symbol')).toHaveTextContent('$');
        expect(screen.getByTestId('formatted')).toHaveTextContent('$');

        fireEvent.click(screen.getByText('Set EUR'));
        expect(screen.getByTestId('currency')).toHaveTextContent('EUR');
        expect(localStorage.getItem('currency')).toBe('EUR');
        expect(screen.getByTestId('symbol')).toHaveTextContent('€');
    });
});
