'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/actions/analytics';

interface AnalyticsTrackerProps {
    productId: string;
    productName: string;
}

export default function AnalyticsTracker({ productId, productName }: AnalyticsTrackerProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!hasTracked.current) {
            hasTracked.current = true;
            trackEvent('view_product', {
                productId: productId,
                pagePath: window.location.pathname,
                meta: { productName }
            });
        }
    }, [productId, productName]);

    return null; // This component renders nothing visually
}
