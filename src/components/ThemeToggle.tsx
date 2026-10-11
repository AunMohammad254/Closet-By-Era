'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';

const noopSubscribe = () => () => {};

const REVEAL_DURATION_MS = 600;

export default function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    // Prevent hydration mismatch: false during SSR and hydration, true afterwards.
    const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

    if (!mounted) {
        return <div className="w-9 h-9" />; // Placeholder to avoid layout shift
    }

    const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!document.startViewTransition || reduceMotion) {
            setTheme(next);
            return;
        }

        // Grow a circle from the button (keyboard clicks report 0,0: use its centre).
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX || rect.left + rect.width / 2;
        const y = event.clientY || rect.top + rect.height / 2;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

        const root = document.documentElement;
        root.classList.add('theme-transition');

        const transition = document.startViewTransition(() => {
            // Apply the class ourselves so the "new" snapshot is guaranteed to be
            // in the new theme; next-themes then persists the choice.
            root.classList.remove('light', 'dark');
            root.classList.add(next);
            root.style.colorScheme = next;
            flushSync(() => setTheme(next));
        });

        transition.ready
            .then(() => {
                root.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                    { duration: REVEAL_DURATION_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            })
            .catch(() => { /* transition skipped; the theme is already applied */ });

        transition.finished.finally(() => root.classList.remove('theme-transition'));
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <Sun className="h-5 w-5 transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute top-2 left-2 h-5 w-5 transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
