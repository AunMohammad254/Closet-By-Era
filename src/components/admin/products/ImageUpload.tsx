'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, Check } from 'lucide-react';
import Image from 'next/image';

// Initialize Supabase client for client-side storage upload
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
    defaultValue?: string;
    onUpload: (url: string) => void;
}

export default function ImageUpload({ defaultValue, onUpload }: Props) {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [preview, setPreview] = useState<string | null>(defaultValue || null);
    const [urlInput, setUrlInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync external default value if it changes
    useEffect(() => {
        if (defaultValue) setPreview(defaultValue);
    }, [defaultValue]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setPreview(publicUrl);
            onUpload(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) return;
        setPreview(urlInput);
        onUpload(urlInput);
    };

    const handleRemove = () => {
        setPreview(null);
        setUrlInput('');
        onUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Upload size={16} />
                    Upload File
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'url'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <LinkIcon size={16} />
                    Image URL
                </button>
            </div>

            {/* Preview Section - Common for both */}
            {preview ? (
                <div className="relative group/preview border-2 border-rose-100 rounded-2xl bg-rose-50/30 p-2">
                    <div className="relative h-72 w-full rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
                        <Image
                            src={preview}
                            alt="Product preview"
                            fill
                            className="object-contain p-4"
                            onError={() => setPreview(null)} // Reset if URL is invalid
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-4 right-4 p-2 bg-white text-rose-600 rounded-full shadow-lg hover:bg-rose-50 hover:scale-110 transition-all z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <>
                    {activeTab === 'upload' ? (
                        <div className="relative border-2 border-dashed border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 bg-gray-50/50 rounded-2xl p-10 transition-all duration-300 group cursor-pointer">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={uploading}
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-3" />
                                    <span className="text-sm font-medium text-gray-900">Uploading Image...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                                    <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:border-rose-100 group-hover:shadow-md">
                                        <Upload className="w-8 h-8 text-rose-400 group-hover:text-rose-500 transition-colors" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-rose-700 transition-colors">
                                        Click to upload image
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        SVG, PNG, JPG or GIF (max 5MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Paste Image Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className="flex-1 rounded-xl border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 transition-colors text-black placeholder-gray-400 bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleUrlSubmit}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Apply
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Direct link to an image file (JPG, PNG, WebP)
                            </p>
                        </div>
                    )}
                </>
            )}

            <input type="hidden" name="image_url" value={preview || ''} />
        </div>
    );
}
