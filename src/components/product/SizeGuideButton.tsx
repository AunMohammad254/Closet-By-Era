'use client';

import { useState } from 'react';
import LazySizeGuideModal from './LazySizeGuideModal';

/** Opens the size guide dialog from anywhere, e.g. the footer (there is no size guide page). */
export default function SizeGuideButton({ className, children }: { className?: string; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button type="button" aria-haspopup="dialog" onClick={() => setIsOpen(true)} className={className}>
                {children}
            </button>
            <LazySizeGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
