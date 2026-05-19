"use client";

import { useState } from "react";
import Link from "next/link";

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  // ── Client-side validation ──────────────────────────────────────────────

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters.";
    }
    return errs;
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setServerError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Unable to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Thank-you state ─────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="py-10 text-center">
        <p className="font-serif text-navy text-2xl mb-3">Thanks.</p>
        <p className="text-navy/60 leading-relaxed">We&rsquo;ll be in touch soon.</p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  const inputClass =
    "w-full border border-navy/20 px-4 py-3 text-navy text-sm bg-white " +
    "placeholder:text-navy/30 focus:outline-none focus:border-brass transition-colors";

  const errorClass = "mt-1.5 text-red-600 text-xs";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="block font-sc text-navy text-xs tracking-widest uppercase mb-2">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className={inputClass}
          placeholder="Your name"
        />
        {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block font-sc text-navy text-xs tracking-widest uppercase mb-2">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={inputClass}
          placeholder="you@example.com"
        />
        {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="block font-sc text-navy text-xs tracking-widest uppercase mb-2">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          rows={6}
          className={`${inputClass} resize-none`}
          placeholder="Your message…"
        />
        {fieldErrors.message && <p className={errorClass}>{fieldErrors.message}</p>}
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-red-600 text-sm">{serverError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="bg-navy text-cream text-xs tracking-widest uppercase px-8 py-3 hover:bg-brass transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : "Send"}
      </button>

      {/* Privacy note */}
      <p className="text-navy/40 text-xs leading-relaxed">
        Your information is used only to respond to your message. See our{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-navy/70 transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
