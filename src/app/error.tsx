'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Something went wrong!</h2>
                <p className="text-gray-600">We apologize for the inconvenience. Please try again.</p>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
