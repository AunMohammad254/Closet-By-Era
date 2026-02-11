export default function TopBanner({ text }: { text?: string }) {
    if (!text) return null;
    return (
        <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-widest font-light px-4">
            <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
    );
}
