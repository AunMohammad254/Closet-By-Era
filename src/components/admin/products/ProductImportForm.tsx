'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importProductsFromCSV } from '@/actions/import';

export default function ProductImportForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string, list?: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await importProductsFromCSV(formData);

            if (res.success) {
                setResult({
                    type: 'success',
                    message: `Successfully imported ${res.count} products!`,
                    list: res.errors // potential partial warnings
                });
                setFile(null);
                // Reset file input visually if needed, simpler to just let user see success
                router.refresh();
            } else {
                setResult({
                    type: 'error',
                    message: 'Import failed.',
                    list: res.errors
                });
            }
        } catch (err) {
            setResult({ type: 'error', message: 'An unexpected error occurred.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ['name', 'category', 'price', 'stock', 'description', 'image'];
        const sample = ['Sample T-Shirt,Mens Tops,1500,50,High quality cotton t-shirt,https://example.com/image.jpg'];
        const csvContent = [headers.join(','), ...sample].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Import Products from CSV</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Upload a CSV file to adds products in bulk.
                    Columns must include: <span className="font-mono bg-gray-100 px-1 rounded">name</span>, <span className="font-mono bg-gray-100 px-1 rounded">category</span>, <span className="font-mono bg-gray-100 px-1 rounded">price</span>.
                    Optional: <span className="font-mono bg-gray-100 px-1 rounded">stock</span>, <span className="font-mono bg-gray-100 px-1 rounded">description</span>, <span className="font-mono bg-gray-100 px-1 rounded">image</span>.
                </p>
                <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium underline"
                >
                    Download Sample CSV Template
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer block">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <span className="text-gray-900 font-medium">
                            {file ? file.name : 'Click to select CSV file'}
                        </span>
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Importing...' : 'Upload & Import'}
                    </button>
                </div>
            </form>

            {result && (
                <div className={`mt-6 p-4 rounded-lg border ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <p className="font-medium">{result.message}</p>
                    {result.list && result.list.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm opacity-90">
                            {result.list.slice(0, 5).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                            {result.list.length > 5 && <li>...and {result.list.length - 5} more issues</li>}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
