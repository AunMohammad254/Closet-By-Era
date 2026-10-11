'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
    isOpen: boolean;
    onSearch?: () => void;
}

/** Product search: submits to /products?search=… */
export default function SearchBar({ isOpen, onSearch }: SearchBarProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const term = query.trim();
        router.push(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
        onSearch?.();
    };

    return (
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-16 pb-4' : 'max-h-0'}`}>
            <form role="search" onSubmit={handleSubmit} className="relative">
                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for products..."
                    aria-label="Search products"
                    tabIndex={isOpen ? 0 : -1}
                    className="w-full px-4 py-3 pl-12 bg-secondary border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </form>
        </div>
    );
}
