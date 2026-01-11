'use client';

import { Bell, Search } from 'lucide-react';

export default function AdminHeader() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:ml-64 sticky top-0 z-30">
            {/* Search */}
            <div className="flex items-center max-w-md w-full">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search size={18} className="text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-rose-300 transition-colors"
                    />
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                </button>

                {/* Profile Placeholder (can be replaced with user avatar) */}
                <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-medium text-sm">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
