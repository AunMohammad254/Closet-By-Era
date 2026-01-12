'use client';

import { useState } from 'react';

interface ProductTabsProps {
    description: string;
    features: string[];
}

type TabType = 'description' | 'features' | 'shipping';

export default function ProductTabs({ description, features }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('description');

    return (
        <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200">
                    {(['description', 'features', 'shipping'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                ? 'text-gray-900 border-b-2 border-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="mt-8">
                    {activeTab === 'description' && (
                        <div className="prose prose-gray max-w-none">
                            <p className="text-gray-600 leading-relaxed">{description}</p>
                        </div>
                    )}

                    {activeTab === 'features' && features && (
                        <ul className="space-y-3">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 mr-3 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="space-y-4 text-gray-600">
                            <p><strong>Delivery:</strong> 3-5 business days within Pakistan</p>
                            <p><strong>Free Shipping:</strong> On orders above PKR 5,000</p>
                            <p><strong>Returns:</strong> Easy 30-day return policy</p>
                            <p><strong>International:</strong> Contact us for international shipping rates</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
