import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Bias Cut Bureau collects, uses, and shares information when you visit this website.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">

      <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs mb-2">Legal</p>
      <h1 className="font-serif text-navy text-3xl md:text-4xl mb-3 leading-snug">
        Privacy Policy
      </h1>
      <p className="text-navy/40 text-sm italic mb-12">
        Last updated: May 2026
      </p>

      <p className="text-navy/70 leading-relaxed mb-12 md:text-lg">
        This Privacy Policy explains how Bias Cut Bureau (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
        &ldquo;our&rdquo;) collects, uses, and shares information when you visit this website.
      </p>

      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          1. Information We Collect
        </h2>
        <p className="text-navy/70 leading-relaxed mb-4">
          We collect very limited information about visitors to this site. The categories include:
        </p>
        <ul className="space-y-4 mb-4">
          <li className="text-navy/70 leading-relaxed pl-4 border-l-2 border-brass/30">
            <strong className="text-navy font-medium">Automatic data:</strong>{" "}
            When you visit, our hosting infrastructure logs standard request information
            including your IP address, browser type, device type, referring URL, and the
            pages you view. This data is used for security, performance monitoring, and
            aggregate analytics.
          </li>
          <li className="text-navy/70 leading-relaxed pl-4 border-l-2 border-brass/30">
            <strong className="text-navy font-medium">Cookies:</strong>{" "}
            This site uses cookies to remember preferences and to support basic analytics.
            Some of our affiliate partners may also set cookies when you click an outbound
            product link, so that any subsequent purchase you make can be attributed to
            this site for commission purposes.
          </li>
          <li className="text-navy/70 leading-relaxed pl-4 border-l-2 border-brass/30">
            <strong className="text-navy font-medium">Contact form data:</strong>{" "}
            If you write to us through the contact page, we receive the information you
            provide (typically a name and email address).
          </li>
        </ul>
        <p className="text-navy/70 leading-relaxed">
          We do not collect payment information, account credentials, or other sensitive
          personal data on this site.
        </p>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          2. How We Use Information
        </h2>
        <p className="text-navy/70 leading-relaxed">
          We use the information we collect to operate and improve the site, understand
          which content is most useful to readers, and respond to messages sent through
          the contact form. We do not sell personal information to third parties.
        </p>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          3. Affiliate Links
        </h2>
        <p className="text-navy/70 leading-relaxed">
          Many product links on this site are affiliate links. When you click one and make
          a qualifying purchase from the retailer, we may earn a small commission at no
          additional cost to you. Affiliate links are marked with{" "}
          <span className="text-brass">↗</span> and carry{" "}
          <code className="text-xs bg-navy/5 px-1 py-0.5">rel=&quot;sponsored nofollow&quot;</code>.
          Clicking an affiliate link may cause the affiliate network or retailer to place
          a cookie on your device for the purpose of attributing your purchase to this site.
        </p>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          4. Third-Party Services
        </h2>
        <p className="text-navy/70 leading-relaxed mb-4">
          This site relies on third-party services for hosting, image delivery, and
          affiliate link tracking. Each of these services has its own privacy policies
          that govern its handling of any data it receives:
        </p>
        <ul className="space-y-2 text-navy/70">
          <li className="pl-4 border-l-2 border-brass/30">
            Hosting and image delivery (Vercel, Supabase)
          </li>
          <li className="pl-4 border-l-2 border-brass/30">
            Affiliate networks (Amazon Associates, Awin, Rakuten, Impact, ShareASale,
            and others as they are added)
          </li>
          <li className="pl-4 border-l-2 border-brass/30">
            Analytics tools, if and when added
          </li>
        </ul>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 5 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          5. Your Choices
        </h2>
        <p className="text-navy/70 leading-relaxed">
          You can disable cookies in your browser settings; this may affect some site
          functionality. You can also use browser tools or extensions to limit tracking
          by third-party affiliate networks. If you have written to us through the contact
          form and would like us to delete the information you provided, write again and
          ask, and we will do so within 30 days.
        </p>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 6 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          6. Children&apos;s Privacy
        </h2>
        <p className="text-navy/70 leading-relaxed">
          This site is not directed to children under 13, and we do not knowingly collect
          information from anyone under that age.
        </p>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 7 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          7. Changes to This Policy
        </h2>
        <p className="text-navy/70 leading-relaxed">
          We may update this Privacy Policy from time to time. The &ldquo;last
          updated&rdquo; date at the top of this page reflects the most recent revision.
        </p>
      </section>

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Section 8 */}
      <section className="mb-10">
        <h2 className="font-serif text-navy text-xl md:text-2xl mb-4">
          8. Contact
        </h2>
        <p className="text-navy/70 leading-relaxed">
          Questions about this Privacy Policy can be sent through our{" "}
          <Link
            href="/contact"
            className="text-brass underline underline-offset-2 hover:text-navy transition-colors"
          >
            Contact page
          </Link>
          .
        </p>
      </section>

    </div>
  );
}
