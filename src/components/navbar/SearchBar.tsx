'use client';

interface SearchBarProps {
    isOpen: boolean;
}

export default function SearchBar({ isOpen }: SearchBarProps) {
    return (
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-16 pb-4' : 'max-h-0'}`}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
    );
}
