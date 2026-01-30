export default function TopBanner({ text }: { text?: string }) {
    if (!text) return null;
    return (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-center py-2 text-xs tracking-widest font-light px-4">
            <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
    );
}
