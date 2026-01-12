'use client';

import { useCompare } from '@/context/CompareContext';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { Transition } from '@headlessui/react';

export default function CompareBar() {
    const { items, removeFromCompare, clearCompare } = useCompare();

    if (items.length === 0) return null;

    return (
        <Transition
            show={items.length > 0}
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
        >
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

                    <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Compare ({items.length}/4):
                        </span>
                        <div className="flex -space-x-2">
                            {items.filter(item => typeof item.image === 'string' && item.image.trim().length > 0).map((item) => (
                                <div key={item.id} className="relative group w-12 h-12 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => removeFromCompare(item.id)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={clearCompare}
                            className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
                        >
                            Clear All
                        </button>
                        <Link
                            href="/compare"
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors text-center"
                        >
                            Compare Products
                        </Link>
                    </div>
                </div>
            </div>
        </Transition>
    );
}
