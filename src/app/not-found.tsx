import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-slate-900">404</h1>
                <h2 className="text-xl font-semibold text-gray-700">Page Not Found</h2>
                <p className="text-gray-600">The page you are looking for does not exist.</p>
                <Link
                    href="/"
                    className="inline-block px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
