'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

export default function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();

    const currencies = [
        { code: 'PKR', label: 'PKR' },
        { code: 'USD', label: 'USD ($)' },
        { code: 'GBP', label: 'GBP (£)' },
        { code: 'EUR', label: 'EUR (€)' },
        { code: 'AED', label: 'AED' },
    ];

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex justify-center items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50 focus:outline-none">
                    {currency}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-1 py-1">
                        {currencies.map((c) => (
                            <Menu.Item key={c.code}>
                                {({ active }) => (
                                    <button
                                        onClick={() => setCurrency(c.code as any)}
                                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                            } group flex w-full items-center rounded-md px-2 py-2 text-sm ${currency === c.code ? 'bg-slate-50 font-bold' : ''
                                            }`}
                                    >
                                        {c.label}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
