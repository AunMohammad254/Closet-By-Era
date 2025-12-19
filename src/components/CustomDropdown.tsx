'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    value: string;
    label: string;
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    variant?: 'default' | 'rose' | 'slate' | 'amber';
    className?: string;
}

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    variant = 'default',
    className = ''
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Get variant-specific colors
    const getVariantStyles = () => {
        switch (variant) {
            case 'rose':
                return {
                    trigger: 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 hover:border-rose-400 hover:shadow-rose-100',
                    triggerText: 'text-rose-900',
                    focusRing: 'focus-visible:ring-rose-500/30 focus-visible:border-rose-500',
                    dropdownBg: 'bg-white',
                    option: 'hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50',
                    optionSelected: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
                    optionText: 'text-gray-700',
                    optionSelectedText: 'text-white',
                    icon: 'text-rose-500',
                    checkmark: 'text-rose-500',
                };
            case 'slate':
                return {
                    trigger: 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 hover:border-slate-400 hover:shadow-slate-100',
                    triggerText: 'text-slate-900',
                    focusRing: 'focus-visible:ring-slate-500/30 focus-visible:border-slate-500',
                    dropdownBg: 'bg-white',
                    option: 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50',
                    optionSelected: 'bg-gradient-to-r from-slate-800 to-slate-900 text-white',
                    optionText: 'text-gray-700',
                    optionSelectedText: 'text-white',
                    icon: 'text-slate-500',
                    checkmark: 'text-slate-500',
                };
            case 'amber':
                return {
                    trigger: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
                    triggerText: 'text-amber-900',
                    focusRing: 'focus-visible:ring-amber-500/30 focus-visible:border-amber-500',
                    dropdownBg: 'bg-white',
                    option: 'hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50',
                    optionSelected: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
                    optionText: 'text-gray-700',
                    optionSelectedText: 'text-white',
                    icon: 'text-amber-500',
                    checkmark: 'text-amber-500',
                };
            default:
                return {
                    trigger: 'bg-white border-gray-200 hover:border-rose-300 hover:shadow-rose-50',
                    triggerText: 'text-gray-900',
                    focusRing: 'focus-visible:ring-rose-500/30 focus-visible:border-rose-500',
                    dropdownBg: 'bg-white',
                    option: 'hover:bg-gradient-to-r hover:from-rose-50 hover:to-transparent',
                    optionSelected: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
                    optionText: 'text-gray-700',
                    optionSelectedText: 'text-white',
                    icon: 'text-rose-500',
                    checkmark: 'text-rose-500',
                };
        }
    };

    const styles = getVariantStyles();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < options.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : options.length - 1
                    );
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (highlightedIndex >= 0) {
                        onChange(options[highlightedIndex].value);
                        setIsOpen(false);
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, options, onChange]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && optionsRef.current && highlightedIndex >= 0) {
            const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            const currentIndex = options.findIndex(opt => opt.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={toggleDropdown}
                className={`
                    relative w-full min-w-[180px] px-4 py-2.5 
                    border rounded-xl
                    text-sm font-medium text-left
                    transition-all duration-300 ease-out
                    shadow-sm hover:shadow-md
                    ${styles.trigger}
                    ${styles.triggerText}
                    ${styles.focusRing}
                    focus:outline-none focus-visible:ring-4
                    cursor-pointer
                    group
                `}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {/* Selected Value */}
                <span className="flex items-center gap-2 pr-8">
                    {/* Animated dot indicator */}
                    <span className={`
                        w-2 h-2 rounded-full 
                        ${variant === 'rose' ? 'bg-rose-500' : variant === 'slate' ? 'bg-slate-700' : variant === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}
                        transition-transform duration-300
                        ${isOpen ? 'scale-125' : 'scale-100'}
                    `} />
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </span>

                {/* Dropdown Arrow */}
                <span className={`
                    absolute right-3 top-1/2 -translate-y-1/2 
                    transition-all duration-300 ease-out
                    ${styles.icon}
                    ${isOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}
                `}>
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </span>

                {/* Hover glow effect */}
                <span className={`
                    absolute inset-0 rounded-xl opacity-0 
                    group-hover:opacity-100 
                    transition-opacity duration-300
                    pointer-events-none
                    ${variant === 'rose' ? 'bg-rose-500/5' : variant === 'slate' ? 'bg-slate-500/5' : variant === 'amber' ? 'bg-amber-500/5' : 'bg-rose-500/5'}
                `} />
            </button>

            {/* Dropdown Menu */}
            <div
                className={`
                    absolute z-50 w-full mt-2
                    ${styles.dropdownBg}
                    border border-gray-100
                    rounded-xl
                    shadow-xl shadow-gray-200/50
                    overflow-hidden
                    transform-gpu origin-top
                    transition-all duration-300 ease-out
                    ${isOpen
                        ? 'opacity-100 scale-100 translate-y-0 visible'
                        : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
                    }
                `}
                role="listbox"
            >
                {/* Gradient top border */}
                <div className={`
                    h-0.5 w-full 
                    ${variant === 'rose'
                        ? 'bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500'
                        : variant === 'slate'
                            ? 'bg-gradient-to-r from-slate-400 via-slate-600 to-slate-800'
                            : variant === 'amber'
                                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500'
                    }
                `} />

                {/* Options */}
                <div
                    ref={optionsRef}
                    className="py-2 max-h-64 overflow-y-auto custom-scrollbar"
                >
                    {options.map((option, index) => {
                        const isSelected = option.value === value;
                        const isHighlighted = index === highlightedIndex;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleOptionClick(option.value)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`
                                    relative w-full px-4 py-2.5
                                    text-sm font-medium text-left
                                    transition-all duration-200 ease-out
                                    flex items-center justify-between gap-3
                                    group/option
                                    ${isSelected
                                        ? `${styles.optionSelected} shadow-sm`
                                        : `${styles.optionText} ${styles.option}`
                                    }
                                    ${isHighlighted && !isSelected ? 'pl-5' : 'pl-4'}
                                `}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {/* Option label */}
                                <span className="flex items-center gap-3">
                                    {/* Animated bullet point */}
                                    <span className={`
                                        w-1.5 h-1.5 rounded-full
                                        transition-all duration-200
                                        ${isSelected
                                            ? 'bg-white scale-110'
                                            : isHighlighted
                                                ? `${variant === 'rose' ? 'bg-rose-400' : variant === 'slate' ? 'bg-slate-400' : variant === 'amber' ? 'bg-amber-400' : 'bg-rose-400'} scale-100`
                                                : 'bg-gray-300 scale-75'
                                        }
                                    `} />
                                    <span className="truncate">{option.label}</span>
                                </span>

                                {/* Checkmark for selected item */}
                                <span className={`
                                    transition-all duration-300
                                    ${isSelected
                                        ? 'opacity-100 scale-100'
                                        : 'opacity-0 scale-75'
                                    }
                                `}>
                                    <svg
                                        className={`w-4 h-4 ${isSelected ? 'text-white' : styles.checkmark}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </span>

                                {/* Hover highlight line */}
                                {!isSelected && (
                                    <span className={`
                                        absolute left-0 top-1/2 -translate-y-1/2
                                        w-1 h-0 
                                        ${variant === 'rose' ? 'bg-rose-500' : variant === 'slate' ? 'bg-slate-700' : variant === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}
                                        rounded-r-full
                                        transition-all duration-200 ease-out
                                        group-hover/option:h-6
                                    `} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
