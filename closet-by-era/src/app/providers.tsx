'use client';

import { CartProvider, AuthProvider, WishlistProvider } from '@/context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    {children}
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}
