'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Command,
    Search,
    Package,
    ShoppingCart,
    Users,
    Settings,
    Tag,
    Gift,
    Star,
    BarChart3,
    Plus,
    X
} from 'lucide-react';

type CommandItem = {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'navigation' | 'action' | 'quick';
};

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const commands: CommandItem[] = [
        // Quick Actions
        { id: 'new-product', title: 'New Product', subtitle: 'Create a new product', icon: <Plus className="w-4 h-4" />, action: () => router.push('/admin/products/new'), category: 'quick' },
        { id: 'new-category', title: 'New Category', subtitle: 'Create a category', icon: <Plus className="w-4 h-4" />, action: () => router.push('/admin/categories'), category: 'quick' },
        { id: 'new-coupon', title: 'New Coupon', subtitle: 'Create a coupon', icon: <Plus className="w-4 h-4" />, action: () => router.push('/admin/coupons'), category: 'quick' },

        // Navigation
        { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Overview & stats', icon: <BarChart3 className="w-4 h-4" />, action: () => router.push('/admin'), category: 'navigation' },
        { id: 'nav-orders', title: 'Orders', subtitle: 'Manage orders', icon: <ShoppingCart className="w-4 h-4" />, action: () => router.push('/admin/orders'), category: 'navigation' },
        { id: 'nav-products', title: 'Products', subtitle: 'Manage inventory', icon: <Package className="w-4 h-4" />, action: () => router.push('/admin/products'), category: 'navigation' },
        { id: 'nav-customers', title: 'Customers', subtitle: 'View customers', icon: <Users className="w-4 h-4" />, action: () => router.push('/admin/users'), category: 'navigation' },
        { id: 'nav-categories', title: 'Categories', subtitle: 'Product categories', icon: <Tag className="w-4 h-4" />, action: () => router.push('/admin/categories'), category: 'navigation' },
        { id: 'nav-coupons', title: 'Coupons', subtitle: 'Discount codes', icon: <Tag className="w-4 h-4" />, action: () => router.push('/admin/coupons'), category: 'navigation' },
        { id: 'nav-gift-cards', title: 'Gift Cards', subtitle: 'Manage gift cards', icon: <Gift className="w-4 h-4" />, action: () => router.push('/admin/gift-cards'), category: 'navigation' },
        { id: 'nav-reviews', title: 'Reviews', subtitle: 'Product reviews', icon: <Star className="w-4 h-4" />, action: () => router.push('/admin/reviews'), category: 'navigation' },
        { id: 'nav-settings', title: 'Settings', subtitle: 'Store settings', icon: <Settings className="w-4 h-4" />, action: () => router.push('/admin/settings'), category: 'navigation' },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.subtitle?.toLowerCase().includes(search.toLowerCase())
    );

    const groupedCommands = {
        quick: filteredCommands.filter(c => c.category === 'quick'),
        navigation: filteredCommands.filter(c => c.category === 'navigation'),
        action: filteredCommands.filter(c => c.category === 'action')
    };

    const flatFiltered = [...groupedCommands.quick, ...groupedCommands.navigation, ...groupedCommands.action];

    // Keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation within palette
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatFiltered[selectedIndex]) {
                flatFiltered[selectedIndex].action();
                setIsOpen(false);
            }
        }
    }, [flatFiltered, selectedIndex]);

    const executeCommand = (command: CommandItem) => {
        command.action();
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                    {/* Search Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
                        <Search className="w-5 h-5 text-slate-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none text-sm"
                        />
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Esc</kbd>
                            <span>to close</span>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto p-2">
                        {flatFiltered.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500">
                                <Command className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No commands found</p>
                            </div>
                        ) : (
                            <>
                                {groupedCommands.quick.length > 0 && (
                                    <>
                                        <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">Quick Actions</div>
                                        {groupedCommands.quick.map((cmd, i) => (
                                            <CommandRow
                                                key={cmd.id}
                                                command={cmd}
                                                isSelected={selectedIndex === i}
                                                onClick={() => executeCommand(cmd)}
                                            />
                                        ))}
                                    </>
                                )}
                                {groupedCommands.navigation.length > 0 && (
                                    <>
                                        <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase mt-2">Navigation</div>
                                        {groupedCommands.navigation.map((cmd, i) => (
                                            <CommandRow
                                                key={cmd.id}
                                                command={cmd}
                                                isSelected={selectedIndex === groupedCommands.quick.length + i}
                                                onClick={() => executeCommand(cmd)}
                                            />
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer Hint */}
                    <div className="px-4 py-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">↵</kbd>
                                Select
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">⌘K</kbd>
                            Toggle
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

function CommandRow({
    command,
    isSelected,
    onClick
}: {
    command: CommandItem;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
        >
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-rose-500/20' : 'bg-slate-800'}`}>
                {command.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{command.title}</p>
                {command.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{command.subtitle}</p>
                )}
            </div>
        </button>
    );
}
