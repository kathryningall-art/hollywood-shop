import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy/10 bg-navy text-cream/70 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── Two-column main row ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 mb-8">

          {/* Left — brand + links */}
          <div>
            <p className="font-serif text-cream text-base mb-3">
              Bias Cut Bureau
            </p>
            <p className="leading-relaxed text-sm mb-6">
              A curated editorial celebrating the style of classic Hollywood,
              1915–1969. Celebrity imagery is public domain or Creative Commons
              licensed.
            </p>
            <nav className="flex items-center gap-1 text-xs text-cream/50 flex-wrap">
              <a
                href="https://pinterest.com/biascutbureau"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brass transition-colors"
              >
                Pinterest
              </a>
              <span className="mx-2 text-cream/20">·</span>
              <Link href="/about" className="hover:text-brass transition-colors">
                About
              </Link>
              <span className="mx-2 text-cream/20">·</span>
              <Link href="/contact" className="hover:text-brass transition-colors">
                Contact
              </Link>
              <span className="mx-2 text-cream/20">·</span>
              <Link href="/privacy" className="hover:text-brass transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>

          {/* Right — affiliate disclosure */}
          <div>
            {/*
              ── LIVE DISCLOSURE (pre-Amazon-approval) ──────────────────────
              TODO: Once Amazon Associates approves the application, swap this
              paragraph for the commented-out "POST-APPROVAL" version below.
              The phrase "As an Amazon Associate" must appear verbatim per
              Amazon's Operating Agreement.
            */}
            <p className="text-cream/50 text-xs leading-relaxed">
              Some links on this site may earn us a commission. These are marked
              with <span className="text-brass">↗</span> and carry{" "}
              <code className="text-xs">rel=&quot;sponsored nofollow&quot;</code>.
              This supports the research and editorial work behind every look.{" "}
              <Link
                href="/about#our-picks"
                className="underline hover:text-cream/80 transition-colors"
              >
                About our picks ↗
              </Link>
            </p>

            {/*
              ── POST-APPROVAL DISCLOSURE ────────────────────────────────────
              Swap the paragraph above for this one once Amazon Associates
              approves. "As an Amazon Associate" is required verbatim.

              <p className="text-cream/50 text-xs leading-relaxed">
                As an Amazon Associate and affiliate partner, we earn from
                qualifying purchases made through links on this site. These
                links are marked with <span className="text-brass">↗</span> and
                carry{" "}
                <code className="text-xs">rel=&quot;sponsored nofollow&quot;</code>.
                This supports the research and editorial work behind every look.{" "}
                <Link
                  href="/about#our-picks"
                  className="underline hover:text-cream/80 transition-colors"
                >
                  About our picks ↗
                </Link>
              </p>
            */}
          </div>
        </div>

        {/* ── Copyright bar ────────────────────────────────────────────── */}
        <div className="border-t border-cream/10 pt-6">
          <p className="text-xs text-cream/30">
            &copy; {year} Bias Cut Bureau. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
