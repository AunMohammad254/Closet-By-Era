'use client';

import Link from 'next/link';

interface Category {
    name: string;
    href: string;
}

interface DesktopNavProps {
    categories: Category[];
}

export default function DesktopNav({ categories }: DesktopNavProps) {
    return (
        <div className="hidden lg:flex items-center space-x-8">
            {categories.map((category) => (
                <Link
                    key={category.name}
                    href={category.href}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wide relative group"
                >
                    {category.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
            ))}
        </div>
    );
}
