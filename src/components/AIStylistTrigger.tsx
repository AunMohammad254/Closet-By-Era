'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';

const AIStylistModal = dynamic(() => import('./AIStylistModal'), {
    ssr: false,
    loading: () => null
});

export default function AIStylistTrigger() {
    const [isStylistOpen, setIsStylistOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false); // To distinguish click vs drag
    const buttonRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Initial position bottom-right (handled via CSS initially, then JS after mount/drag)
    // We'll trust fixed positioning CSS for initial state to avoid hydration mismatch,
    // but once dragged, we switch to inline styles.
    const [isCustomPosition, setIsCustomPosition] = useState(false);

    useEffect(() => {
        // Handle window resize to keep button in bounds if needed
        // For now, simple logic is fine.
    }, []);

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        setHasMoved(false);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Calculate offset from button top-left
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            dragStartRef.current = {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }
    };

    useEffect(() => {
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;

            e.preventDefault(); // Prevent scrolling while dragging on touch

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            // Calculate new position
            let newX = clientX - dragStartRef.current.x;
            let newY = clientY - dragStartRef.current.y;

            // Bounds checking (keep within window)
            const maxX = window.innerWidth - (buttonRef.current?.offsetWidth || 0);
            const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 0);

            newX = Math.max(10, Math.min(newX, maxX - 10)); // 10px padding
            newY = Math.max(10, Math.min(newY, maxY - 10));

            setPosition({ x: newX, y: newY });
            setIsCustomPosition(true);
            setHasMoved(true);
        };

        const handlePointerUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handlePointerMove);
            window.addEventListener('mouseup', handlePointerUp);
            window.addEventListener('touchmove', handlePointerMove, { passive: false });
            window.addEventListener('touchend', handlePointerUp);
        }

        return () => {
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
            window.removeEventListener('touchmove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
        };
    }, [isDragging]);

    const handleClick = () => {
        if (!hasMoved) {
            setIsStylistOpen(true);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <div
                ref={buttonRef}
                style={isCustomPosition ? { left: position.x, top: position.y, bottom: 'auto', right: 'auto' } : {}}
                className={`fixed z-40 touch-none ${!isCustomPosition ? 'top-32 right-6' : ''}`}
            >
                <div className="relative group">
                    {/* Close Button (appears on hover or if dragging active?) */}
                    {/* Make it always visible on mobile if needed, or small X corner */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="absolute -top-2 -right-2 bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-500 rounded-full p-1 shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-50"
                        title="Remove button"
                        aria-label="Remove AI Stylist button"
                    >
                        <X size={14} />
                    </button>

                    <button
                        onMouseDown={handlePointerDown}
                        onTouchStart={handlePointerDown}
                        onClick={handleClick}
                        className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-base font-medium rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-move ${isDragging ? 'scale-105 cursor-grabbing' : ''}`}
                    >
                        <span className="text-xl animate-pulse">✨</span>
                        <span className="hidden sm:inline">AI Stylist</span>
                        {/* Show icon only on very small screens if preferred, but user didn't ask to hide text */}
                    </button>
                </div>
            </div>

            <AIStylistModal isOpen={isStylistOpen} onClose={() => setIsStylistOpen(false)} />
        </>
    );
}
