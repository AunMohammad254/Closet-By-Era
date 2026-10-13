'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const SizeGuideModal = dynamic(() => import('./SizeGuideModal'), { ssr: false });

interface LazySizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultCategory?: string;
}

/**
 * The size guide dialog (tabs and size tables), fetched the first time it opens
 * and kept mounted afterwards so its closing transition can run.
 */
export default function LazySizeGuideModal({ isOpen, onClose, defaultCategory }: LazySizeGuideModalProps) {
    const [hasOpened, setHasOpened] = useState(isOpen);
    if (isOpen && !hasOpened) setHasOpened(true);

    if (!hasOpened) return null;
    return <SizeGuideModal isOpen={isOpen} onClose={onClose} defaultCategory={defaultCategory} />;
}
