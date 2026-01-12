'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { SIZE_DATA } from '@/lib/size-data';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultCategory?: string;
}

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function SizeGuideModal({ isOpen, onClose, defaultCategory = 'mens-tops' }: SizeGuideModalProps) {
    const categories = Object.keys(SIZE_DATA);
    // Ensure default category is valid, otherwise use first one
    const initialCategory = categories.includes(defaultCategory) ? defaultCategory : categories[0];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                                        Size Guide
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <Tab.Group defaultIndex={categories.indexOf(initialCategory)}>
                                    <Tab.List className="flex space-x-1 rounded-xl bg-slate-100 p-1 mb-6 overflow-x-auto">
                                        {categories.map((key) => (
                                            <Tab
                                                key={key}
                                                className={({ selected }) =>
                                                    classNames(
                                                        'w-full min-w-fit rounded-lg py-2.5 px-4 text-sm font-medium leading-5 transition-all whitespace-nowrap',
                                                        selected
                                                            ? 'bg-white text-slate-900 shadow'
                                                            : 'text-gray-600 hover:bg-white/[0.12] hover:text-slate-800'
                                                    )
                                                }
                                            >
                                                {SIZE_DATA[key].category}
                                            </Tab>
                                        ))}
                                    </Tab.List>

                                    <Tab.Panels>
                                        {categories.map((key) => {
                                            const chart = SIZE_DATA[key];
                                            return (
                                                <Tab.Panel key={key} className="focus:outline-none">
                                                    <p className="text-sm text-gray-500 mb-4">{chart.description}</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    {chart.headers.map((header) => (
                                                                        <th
                                                                            key={header}
                                                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                                                        >
                                                                            {header}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {chart.rows.map((row, rowIdx) => (
                                                                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                                                        {row.map((cell, cellIdx) => (
                                                                            <td
                                                                                key={cellIdx}
                                                                                className={`px-6 py-4 whitespace-nowrap text-sm ${cellIdx === 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}
                                                                            >
                                                                                {cell}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="mt-6 text-xs text-gray-400">
                                                        * Measurements are in centimeters. Tolerance +/- 1-2cm.
                                                    </div>
                                                </Tab.Panel>
                                            );
                                        })}
                                    </Tab.Panels>
                                </Tab.Group>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
