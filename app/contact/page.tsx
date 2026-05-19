import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Bias Cut Bureau for affiliate inquiries, editorial corrections, or anything else.",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 md:py-24">

      <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs mb-2">Get in Touch</p>
      <h1 className="font-serif text-navy text-3xl md:text-4xl mb-4 leading-snug">
        Contact
      </h1>
      <p className="text-navy/60 leading-relaxed mb-12 md:text-lg">
        For affiliate inquiries, image source questions, editorial corrections, or
        anything else, you can reach Bias Cut Bureau through the form below. We
        typically reply within a few business days.
      </p>

      <ContactForm />

    </div>
  );
}
