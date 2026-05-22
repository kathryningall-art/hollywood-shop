import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Bias Cut Bureau for affiliate inquiries, editorial corrections, or anything else.",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 md:py-24">

      <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs mb-2">Get in Touch</p>
      <h1 className="font-serif text-navy text-3xl md:text-4xl mb-4 leading-snug">
        Contact
      </h1>
      <p className="text-navy/60 leading-relaxed mb-10 md:text-lg">
        For affiliate inquiries, image source questions, editorial corrections, or
        anything else, please email us. We typically reply within a few business days.
      </p>

      <div className="border-t border-b border-navy/10 py-10 text-center">
        <p className="font-sc text-brass tracking-widest uppercase text-xs mb-3">Email</p>
        <a
          href="mailto:info@biascutbureau.com"
          className="font-serif text-navy text-2xl md:text-3xl hover:text-brass transition-colors break-all"
        >
          info@biascutbureau.com
        </a>
      </div>

    </div>
  );
}
