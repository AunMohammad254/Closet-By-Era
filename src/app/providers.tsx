import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CompareProvider } from '@/context/CompareContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
                <CurrencyProvider>
                    <CompareProvider>
                        <CartProvider>
                            <WishlistProvider>
                                {children}
                            </WishlistProvider>
                        </CartProvider>
                    </CompareProvider>
                </CurrencyProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
