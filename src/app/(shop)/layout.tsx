import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CompareBar from '@/components/product/CompareBar';
import ChatWidget from '@/components/chat/ChatWidget';

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
            <CompareBar />
            <Footer />
        </>
    );
}
