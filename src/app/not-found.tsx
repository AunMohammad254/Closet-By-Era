import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground">404</h1>
                <h2 className="text-xl font-semibold text-muted-foreground">Page Not Found</h2>
                <p className="text-muted-foreground">The page you are looking for does not exist.</p>
                <Link
                    href="/"
                    className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
