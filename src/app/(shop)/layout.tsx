import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CompareBar from '@/components/product/CompareBar';
import ChatWidget from '@/components/chat/ChatWidget';
import WhatsAppButton from '@/components/WhatsAppButton';

import { getStoreSettings } from '@/actions/settings';
import { getWhatsAppNumber } from '@/lib/store-settings';

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: settings } = await getStoreSettings();
    // Set NEXT_PUBLIC_WHATSAPP_NUMBER (e.g. 923001234567) to show the chat button.
    const whatsappNumber = getWhatsAppNumber();

    return (
        <>
            <Navbar announcement={settings?.content?.announcement_bar} />
            {children}
            <ChatWidget />
            {whatsappNumber && (
                <WhatsAppButton
                    phoneNumber={whatsappNumber}
                    message="Hi! I'm interested in Closet By Era products. Can you help me?"
                />
            )}
            <CompareBar />
            <Footer />
        </>
    );
}
