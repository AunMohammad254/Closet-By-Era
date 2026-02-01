'use client';

import { useState, useEffect } from 'react';
import {
    getBanners, createBanner, deleteBanner, Banner,
    getPopups, createPopup, togglePopup, deletePopup, Popup,
    getFAQs, createFAQ, updateFAQ, deleteFAQ, FAQ
} from '@/actions/cms';
import {
    Image, MessageSquare, HelpCircle, Plus, Trash2, Loader2, X,
    ToggleLeft, ToggleRight, Edit2, GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'banners' | 'popups' | 'faqs';

export default function CMSPage() {
    const [activeTab, setActiveTab] = useState<Tab>('banners');
    const [loading, setLoading] = useState(true);

    // Data
    const [banners, setBanners] = useState<Banner[]>([]);
    const [popups, setPopups] = useState<Popup[]>([]);
    const [faqs, setFAQs] = useState<FAQ[]>([]);

    // Modals
    const [showBannerModal, setShowBannerModal] = useState(false);
    const [showPopupModal, setShowPopupModal] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

    // Banner form
    const [bannerTitle, setBannerTitle] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const [bannerLink, setBannerLink] = useState('');
    const [bannerPosition, setBannerPosition] = useState<'hero' | 'sidebar' | 'footer'>('hero');

    // Popup form
    const [popupTitle, setPopupTitle] = useState('');
    const [popupContent, setPopupContent] = useState('');
    const [popupTrigger, setPopupTrigger] = useState<'exit_intent' | 'scroll' | 'timer' | 'page_load'>('page_load');

    // FAQ form
    const [faqQuestion, setFaqQuestion] = useState('');
    const [faqAnswer, setFaqAnswer] = useState('');
    const [faqCategory, setFaqCategory] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [b, p, f] = await Promise.all([getBanners(), getPopups(), getFAQs()]);
        if (b.success && b.data) setBanners(b.data);
        if (p.success && p.data) setPopups(p.data);
        if (f.success && f.data) setFAQs(f.data);
        setLoading(false);
    };

    const handleCreateBanner = async () => {
        if (!bannerTitle || !bannerImage) {
            toast.error('Title and image are required');
            return;
        }
        const result = await createBanner({
            title: bannerTitle,
            image_url: bannerImage,
            link_url: bannerLink || null,
            position: bannerPosition,
            is_active: true,
            starts_at: null,
            ends_at: null
        });
        if (result.success) {
            toast.success('Banner created');
            setShowBannerModal(false);
            setBannerTitle('');
            setBannerImage('');
            setBannerLink('');
            loadData();
        } else {
            toast.error(result.error || 'Failed');
        }
    };

    const handleCreatePopup = async () => {
        if (!popupTitle || !popupContent) {
            toast.error('Title and content are required');
            return;
        }
        const result = await createPopup({
            title: popupTitle,
            content: popupContent,
            image_url: null,
            trigger: popupTrigger,
            trigger_value: popupTrigger === 'timer' ? 5 : popupTrigger === 'scroll' ? 50 : null,
            show_on_pages: null,
            is_active: true
        });
        if (result.success) {
            toast.success('Popup created');
            setShowPopupModal(false);
            setPopupTitle('');
            setPopupContent('');
            loadData();
        } else {
            toast.error(result.error || 'Failed');
        }
    };

    const handleSaveFAQ = async () => {
        if (!faqQuestion || !faqAnswer) {
            toast.error('Question and answer are required');
            return;
        }
        if (editingFAQ) {
            const result = await updateFAQ(editingFAQ.id, {
                question: faqQuestion,
                answer: faqAnswer,
                category: faqCategory || null
            });
            if (result.success) {
                toast.success('FAQ updated');
            }
        } else {
            const result = await createFAQ({
                question: faqQuestion,
                answer: faqAnswer,
                category: faqCategory || null,
                sort_order: faqs.length,
                is_active: true
            });
            if (result.success) {
                toast.success('FAQ created');
            }
        }
        setShowFAQModal(false);
        setEditingFAQ(null);
        setFaqQuestion('');
        setFaqAnswer('');
        setFaqCategory('');
        loadData();
    };

    const tabs = [
        { id: 'banners' as Tab, label: 'Banners', icon: Image, count: banners.length },
        { id: 'popups' as Tab, label: 'Popups', icon: MessageSquare, count: popups.length },
        { id: 'faqs' as Tab, label: 'FAQs', icon: HelpCircle, count: faqs.length }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Content Management</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage banners, popups, and FAQs</p>
                </div>
                <button
                    onClick={() => {
                        if (activeTab === 'banners') setShowBannerModal(true);
                        else if (activeTab === 'popups') setShowPopupModal(true);
                        else setShowFAQModal(true);
                    }}
                    className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add {activeTab.slice(0, -1)}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === tab.id
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className="px-1.5 py-0.5 text-xs bg-slate-700/50 rounded">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Banners Tab */}
            {activeTab === 'banners' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {banners.map(banner => (
                        <div key={banner.id} className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                            <div className="aspect-video bg-slate-800 relative">
                                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-slate-900/80 text-slate-300 rounded">
                                    {banner.position}
                                </span>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-200">{banner.title}</p>
                                    <p className={`text-xs ${banner.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {banner.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        await deleteBanner(banner.id);
                                        loadData();
                                        toast.success('Banner deleted');
                                    }}
                                    className="p-2 text-slate-400 hover:text-rose-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No banners yet. Click "Add banner" to create one.
                        </div>
                    )}
                </div>
            )}

            {/* Popups Tab */}
            {activeTab === 'popups' && (
                <div className="space-y-3">
                    {popups.map(popup => (
                        <div key={popup.id} className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-200">{popup.title}</p>
                                <p className="text-sm text-slate-400">{popup.trigger.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        await togglePopup(popup.id, !popup.is_active);
                                        loadData();
                                    }}
                                    className={popup.is_active ? 'text-emerald-400' : 'text-slate-500'}
                                >
                                    {popup.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                </button>
                                <button
                                    onClick={async () => {
                                        await deletePopup(popup.id);
                                        loadData();
                                        toast.success('Popup deleted');
                                    }}
                                    className="p-2 text-slate-400 hover:text-rose-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {popups.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No popups yet. Click "Add popup" to create one.
                        </div>
                    )}
                </div>
            )}

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
                <div className="space-y-3">
                    {faqs.map(faq => (
                        <div key={faq.id} className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-4">
                            <div className="flex items-start gap-3">
                                <GripVertical className="w-5 h-5 text-slate-600 mt-1" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-200">{faq.question}</p>
                                    <p className="text-sm text-slate-400 mt-1">{faq.answer}</p>
                                    {faq.category && (
                                        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                                            {faq.category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setEditingFAQ(faq);
                                            setFaqQuestion(faq.question);
                                            setFaqAnswer(faq.answer);
                                            setFaqCategory(faq.category || '');
                                            setShowFAQModal(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-blue-400"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await deleteFAQ(faq.id);
                                            loadData();
                                            toast.success('FAQ deleted');
                                        }}
                                        className="p-2 text-slate-400 hover:text-rose-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {faqs.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No FAQs yet. Click "Add FAQ" to create one.
                        </div>
                    )}
                </div>
            )}

            {/* Banner Modal */}
            {showBannerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">New Banner</h3>
                            <button onClick={() => setShowBannerModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Title" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <input type="text" placeholder="Image URL" value={bannerImage} onChange={e => setBannerImage(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <input type="text" placeholder="Link URL (optional)" value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <select value={bannerPosition} onChange={e => setBannerPosition(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl">
                                <option value="hero">Hero</option>
                                <option value="sidebar">Sidebar</option>
                                <option value="footer">Footer</option>
                            </select>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowBannerModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                            <button onClick={handleCreateBanner} className="px-4 py-2 bg-rose-500 text-white rounded-xl">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup Modal */}
            {showPopupModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">New Popup</h3>
                            <button onClick={() => setShowPopupModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Title" value={popupTitle} onChange={e => setPopupTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <textarea placeholder="Content" value={popupContent} onChange={e => setPopupContent(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <select value={popupTrigger} onChange={e => setPopupTrigger(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl">
                                <option value="page_load">Page Load</option>
                                <option value="exit_intent">Exit Intent</option>
                                <option value="scroll">On Scroll (50%)</option>
                                <option value="timer">Timer (5s)</option>
                            </select>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowPopupModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                            <button onClick={handleCreatePopup} className="px-4 py-2 bg-rose-500 text-white rounded-xl">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {showFAQModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">{editingFAQ ? 'Edit' : 'New'} FAQ</h3>
                            <button onClick={() => { setShowFAQModal(false); setEditingFAQ(null); }} className="text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Question" value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <textarea placeholder="Answer" value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                            <input type="text" placeholder="Category (optional)" value={faqCategory} onChange={e => setFaqCategory(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl" />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => { setShowFAQModal(false); setEditingFAQ(null); }} className="px-4 py-2 text-slate-400">Cancel</button>
                            <button onClick={handleSaveFAQ} className="px-4 py-2 bg-rose-500 text-white rounded-xl">{editingFAQ ? 'Update' : 'Create'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
