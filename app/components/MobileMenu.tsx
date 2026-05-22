"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Collections" },
  { href: "/browse", label: "Browse" },
  { href: "/about", label: "About" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 -mr-2 text-navy"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-cream border-t border-navy/10 shadow-md">
          <nav className="flex flex-col px-6 py-2 text-sm tracking-widest uppercase text-warm-gray">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-navy transition-colors py-4 border-b border-navy/5 last:border-b-0"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
