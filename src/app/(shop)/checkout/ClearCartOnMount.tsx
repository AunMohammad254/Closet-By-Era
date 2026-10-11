'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

/** Empties the cart once a card payment has gone through. */
export default function ClearCartOnMount() {
    const { clearCart } = useCart();
    useEffect(() => {
        clearCart();
        // Run once: clearCart's identity may change as the cart empties.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}
