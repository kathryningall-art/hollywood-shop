import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dressed in Silver — Classic Hollywood Style",
    template: "%s | Dressed in Silver",
  },
  description:
    "Shop the looks of classic Hollywood's golden age — public-domain imagery, modern pieces inspired by the screen sirens of 1915–1969.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${ebGaramond.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream text-navy">
        <header className="border-b border-navy/10 bg-cream/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-serif text-xl md:text-2xl tracking-wide text-navy hover:text-brass transition-colors group"
            >
              Dressed in Silver
              <span className="block h-px bg-brass scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left mt-0.5 opacity-60" />
            </Link>
            <nav className="hidden md:flex items-center gap-2 text-sm tracking-widest uppercase text-warm-gray">
              <Link href="/" className="hover:text-navy transition-colors px-3">
                Collections
              </Link>
              <span className="text-brass/40 text-xs">◆</span>
              <Link href="/about" className="hover:text-navy transition-colors px-3">
                About
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-navy/10 bg-navy text-cream/70 mt-24">
          <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-serif text-cream text-base mb-2">
                Dressed in Silver
              </p>
              <p className="leading-relaxed">
                A curated editorial celebrating the style of classic Hollywood,
                1915–1969. All celebrity imagery is public domain or Creative
                Commons licensed.
              </p>
            </div>
            <div>
              <p className="text-cream/50 text-xs leading-relaxed">
                As an Amazon Associate and affiliate partner, we earn from
                qualifying purchases made through links on this site. This
                supports the research and editorial work behind every look.
                Affiliate links are marked with{" "}
                <span className="text-brass">↗</span> and carry{" "}
                <code className="text-xs">rel=&quot;sponsored nofollow&quot;</code>.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
