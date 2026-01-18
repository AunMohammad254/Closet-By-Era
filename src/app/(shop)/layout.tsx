import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CompareBar from '@/components/product/CompareBar';
import ChatWidget from '@/components/chat/ChatWidget';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            {children}
            <ChatWidget />
            <WhatsAppButton 
                phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923001234567'}
                message="Hi! I'm interested in Closet By Era products. Can you help me?"
            />
            <CompareBar />
            <Footer />
        </>
    );
}
