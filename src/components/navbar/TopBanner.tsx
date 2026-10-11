export default function TopBanner({ text }: { text?: string }) {
    if (!text) return null;
    return (
        <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-widest font-light px-4">
            {/* Plain text: this comes from store_settings and must not be able to inject markup. */}
            <div>{text}</div>
        </div>
    );
}
