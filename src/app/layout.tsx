import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Closet By Era | Premium Fashion & Style",
  description: "Discover timeless elegance with our curated collection of premium fashion. Shop the latest trends in women's and men's clothing, accessories, and more.",
  keywords: ["fashion", "clothing", "premium", "style", "women", "men", "accessories", "Pakistani fashion"],
  openGraph: {
    title: "Closet By Era | Premium Fashion & Style",
    description: "Discover timeless elegance with our curated collection of premium fashion.",
    type: "website",
    locale: "en_US",
    siteName: "Closet By Era",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
