import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond, Cormorant_SC } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/app/components/Footer";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

const cormorantSC = Cormorant_SC({
  variable: "--font-cormorant-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.biascutbureau.com"),
  title: {
    default: "Bias Cut Bureau — Classic Hollywood Style",
    template: "%s | Bias Cut Bureau",
  },
  description:
    "Shop the looks of classic Hollywood's golden age — public-domain imagery, modern pieces inspired by the screen sirens of 1915–1969.",
  openGraph: {
    siteName: "Bias Cut Bureau",
    url: "https://www.biascutbureau.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${ebGaramond.variable} ${cormorantSC.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream text-navy">
        <header className="border-b border-navy/10 bg-cream sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="block">
              <Image
                src="/brand/M4-lockup-horizontal.png"
                alt="Bias Cut Bureau"
                width={2400}
                height={884}
                className="h-28 w-auto"
                priority
              />
            </Link>
            <nav className="hidden md:flex items-center gap-2 text-sm tracking-widest uppercase text-warm-gray">
              <Link href="/" className="hover:text-navy transition-colors px-3">
                Collections
              </Link>
              <Link href="/browse" className="hover:text-navy transition-colors px-3">
                Browse
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
