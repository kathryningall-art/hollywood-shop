/**
 * GET /api/pin/[lookId] — Returns a 1000x1500 PNG pin image for a look.
 *
 * Admin-auth only. Used by the Generate Pin card in the look admin page
 * to preview and download pin images for manual Pinterest upload.
 *
 * Renders via next/og (Satori under the hood). Uses Node runtime so we
 * can read brand assets from disk.
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/og";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

// ─── Constants ────────────────────────────────────────────────────────────────

const FRAME = { W: 1000, H: 1500 };
const PHOTO = { X: 73, Y: 60, W: 855, H: 1140 };
const TEXT_ZONE_TOP = 1200;

const COLOR_CREAM = "#F1E9D4";
const COLOR_NAVY = "#1C2B4E";
const COLOR_BRASS = "#B6914A";
const COLOR_BRASS_70 = "rgba(182, 145, 74, 0.7)";
const COLOR_BRASS_55 = "rgba(182, 145, 74, 0.55)";

// ─── Font loading (Bodoni Moda from Google Fonts) ─────────────────────────────

type FontSpec = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal" | "italic";
};

let fontsPromise: Promise<FontSpec[]> | null = null;

async function fetchGoogleFont(
  family: string,
  weight: number,
  italic: boolean
): Promise<ArrayBuffer> {
  // Satori uses opentype.js which only supports TTF/OTF, not WOFF2.
  // Use an older Firefox UA so Google Fonts serves TTF instead of WOFF2.
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
    `:ital,wght@${italic ? 1 : 0},${weight}&display=swap`;

  const cssRes = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0",
    },
  });
  if (!cssRes.ok) throw new Error(`Google Fonts CSS HTTP ${cssRes.status}`);
  const css = await cssRes.text();

  // Satori (via opentype.js) supports TTF, OTF, and WOFF — but NOT WOFF2.
  // Google Fonts serves whichever format the User-Agent best supports.
  // Firefox 31 UA gets us WOFF (or sometimes TTF), never WOFF2.
  const match =
    css.match(/src:\s*url\((https:[^)]+)\)\s*format\('truetype'\)/) ||
    css.match(/src:\s*url\((https:[^)]+)\)\s*format\('opentype'\)/) ||
    css.match(/src:\s*url\((https:[^)]+)\)\s*format\('woff'\)/);
  if (!match) {
    console.warn(
      `[pin] no supported font URL for ${family} ${weight}${italic ? "i" : ""}. CSS preview:`,
      css.slice(0, 300)
    );
    throw new Error(
      `No TTF/OTF/WOFF URL found in CSS for ${family} ${weight}${italic ? "i" : ""}`
    );
  }

  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Font binary HTTP ${fontRes.status}`);
  return fontRes.arrayBuffer();
}

async function loadBodoniFonts(): Promise<FontSpec[]> {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    try {
      const [italic400, italic600, bold700] = await Promise.all([
        fetchGoogleFont("Bodoni Moda", 400, true),
        fetchGoogleFont("Bodoni Moda", 600, true),
        fetchGoogleFont("Bodoni Moda", 700, false),
      ]);
      return [
        { name: "Bodoni Moda", data: italic400, weight: 400, style: "italic" } as FontSpec,
        { name: "Bodoni Moda", data: italic600, weight: 600, style: "italic" } as FontSpec,
        { name: "Bodoni Moda", data: bold700, weight: 700, style: "normal" } as FontSpec,
      ];
    } catch (err) {
      console.error("[pin] Bodoni Moda font load failed — falling back to system serif:", err);
      fontsPromise = null; // allow retry on next request
      return [];
    }
  })();
  return fontsPromise;
}

// ─── M4 mark loading ──────────────────────────────────────────────────────────

const m4MarkCache: Record<string, string | null> = {};
const m4MarkChecked: Record<string, boolean> = {};

function loadM4Mark(filename: string): string | null {
  if (m4MarkChecked[filename]) return m4MarkCache[filename];
  m4MarkChecked[filename] = true;
  try {
    const filepath = path.join(process.cwd(), `public/brand/${filename}`);
    fs.accessSync(filepath, fs.constants.R_OK);
    m4MarkCache[filename] = absoluteUrl(`/brand/${filename}`);
  } catch (err) {
    console.error(`[pin] M4 mark ${filename} missing on disk — pin will render without it:`, err);
    m4MarkCache[filename] = null;
  }
  return m4MarkCache[filename];
}

// ─── Pin layout (JSX for ImageResponse / Satori) ──────────────────────────────

function PinLayout({
  imageUrl,
  starName,
  filmAndYear,
  fontFamily,
  m4Mark,
  theme,
}: {
  imageUrl: string;
  starName: string;
  filmAndYear: string | null;
  fontFamily: string;
  m4Mark: string | null;
  theme: "cream" | "navy";
}) {
  const bgColor = theme === "navy" ? COLOR_NAVY : COLOR_CREAM;
  const starNameColor = theme === "navy" ? COLOR_CREAM : COLOR_NAVY;
  // Photo zone inset border position (24px in from photo edges)
  const insetOffset = 24;
  // Corner bracket arm length (~42px)
  const bracketArm = 42;
  // Mid-photo accent lines (~70px long, at vertical midpoint y=630 from photo top)
  const midpointYInsidePhoto = PHOTO.H / 2; // 570
  const midpointAccentLen = 70;

  return (
    <div
      style={{
        width: FRAME.W,
        height: FRAME.H,
        display: "flex",
        flexDirection: "column",
        backgroundColor: bgColor,
        fontFamily,
        position: "relative",
      }}
    >
      {/* ── Photo zone ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: PHOTO.Y,
          left: PHOTO.X,
          width: PHOTO.W,
          height: PHOTO.H,
          display: "flex",
        }}
      >
        {/* The hero image itself */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width={PHOTO.W}
          height={PHOTO.H}
          style={{ width: PHOTO.W, height: PHOTO.H, objectFit: "cover" }}
        />

        {/* Gold inset border (rectangle at 24px inset, no fill) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: insetOffset,
            left: insetOffset,
            width: PHOTO.W - insetOffset * 2,
            height: PHOTO.H - insetOffset * 2,
            border: `2px solid ${COLOR_BRASS_70}`,
          }}
        />

        {/* Four corner brackets — each is two perpendicular lines via borders */}
        {/* Top-left */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: insetOffset,
            left: insetOffset,
            width: bracketArm,
            height: bracketArm,
            borderTop: `2px solid ${COLOR_BRASS}`,
            borderLeft: `2px solid ${COLOR_BRASS}`,
          }}
        />
        {/* Top-right */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: insetOffset,
            right: insetOffset,
            width: bracketArm,
            height: bracketArm,
            borderTop: `2px solid ${COLOR_BRASS}`,
            borderRight: `2px solid ${COLOR_BRASS}`,
          }}
        />
        {/* Bottom-left */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: insetOffset,
            left: insetOffset,
            width: bracketArm,
            height: bracketArm,
            borderBottom: `2px solid ${COLOR_BRASS}`,
            borderLeft: `2px solid ${COLOR_BRASS}`,
          }}
        />
        {/* Bottom-right */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: insetOffset,
            right: insetOffset,
            width: bracketArm,
            height: bracketArm,
            borderBottom: `2px solid ${COLOR_BRASS}`,
            borderRight: `2px solid ${COLOR_BRASS}`,
          }}
        />

        {/* Midpoint horizontal accents (left + right, starting at the inset border) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: midpointYInsidePhoto - 1,
            left: insetOffset,
            width: midpointAccentLen,
            height: 2,
            backgroundColor: COLOR_BRASS_55,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: midpointYInsidePhoto - 1,
            right: insetOffset,
            width: midpointAccentLen,
            height: 2,
            backgroundColor: COLOR_BRASS_55,
          }}
        />
      </div>

      {/* ── Text zone (y=1200 to y=1500) ──────────────────────────────── */}
      {/* Bottom-aligned: diamond sits 32px from pin bottom, stack grows upward. */}
      <div
        style={{
          position: "absolute",
          top: TEXT_ZONE_TOP,
          left: 0,
          right: 0,
          height: FRAME.H - TEXT_ZONE_TOP,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 32,
        }}
      >
        {filmAndYear && (
          <div
            style={{
              fontSize: 28,
              fontStyle: "italic",
              fontWeight: 400,
              color: COLOR_BRASS,
              letterSpacing: 2.8, // ~0.1em × 28px
              marginBottom: 24,
              display: "flex",
            }}
          >
            {filmAndYear}
          </div>
        )}

        <div
          style={{
            fontSize: 39,
            fontWeight: 700,
            color: starNameColor,
            letterSpacing: 1.95, // ~0.05em × 39px
            marginBottom: 24,
            display: "flex",
          }}
        >
          {starName}
        </div>

        <div
          style={{
            fontSize: 29,
            fontStyle: "italic",
            fontWeight: 600,
            color: COLOR_BRASS,
            letterSpacing: 5.2, // ~0.18em × 29px
            marginBottom: 28,
            display: "flex",
          }}
        >
          Shop the Look →
        </div>

        {m4Mark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m4Mark}
            alt=""
            width={66}
            height={66}
            style={{ width: 66, height: 66 }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Shared text outline ──────────────────────────────────────────────────────
// Simulates CSS text-stroke via multi-directional shadows. Hard 3px ring at
// 8 cardinal/diagonal positions plus two blurred halo layers for legibility
// over busy photo backgrounds.
const TEXT_OUTLINE =
  "-2px -2px 0 rgba(4,8,18,1)," +
  " 2px -2px 0 rgba(4,8,18,1)," +
  "-2px  2px 0 rgba(4,8,18,1)," +
  " 2px  2px 0 rgba(4,8,18,1)," +
  " 0   -3px 0 rgba(4,8,18,1)," +
  " 0    3px 0 rgba(4,8,18,1)," +
  "-3px  0   0 rgba(4,8,18,1)," +
  " 3px  0   0 rgba(4,8,18,1)," +
  " 0    0  18px rgba(4,8,18,0.85)," +
  " 0    0  40px rgba(4,8,18,0.55)";

// Lighter variant for Reel — hard outline only, single soft halo.
// The bottom gradient in ReelLayout already provides background separation,
// so the heavy double-halo of TEXT_OUTLINE isn't needed.
const REEL_OUTLINE =
  "-2px -2px 0 rgba(4,8,18,1)," +
  " 2px -2px 0 rgba(4,8,18,1)," +
  "-2px  2px 0 rgba(4,8,18,1)," +
  " 2px  2px 0 rgba(4,8,18,1)," +
  " 0   -3px 0 rgba(4,8,18,1)," +
  " 0    3px 0 rgba(4,8,18,1)," +
  "-3px  0   0 rgba(4,8,18,1)," +
  " 3px  0   0 rgba(4,8,18,1)," +
  " 0    0  10px rgba(4,8,18,0.5)";

// ─── Brass layout — full-bleed photo, brass text left-aligned ────────────────

function BrassLayout({
  imageUrl,
  starName,
  filmAndYear,
  fontFamily,
}: {
  imageUrl: string;
  starName: string;
  filmAndYear: string | null;
  fontFamily: string;
}) {

  return (
    <div
      style={{
        width: FRAME.W,
        height: FRAME.H,
        display: "flex",
        position: "relative",
        fontFamily,
      }}
    >
      {/* Full-bleed photo — no gradient, photo is fully visible */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        width={FRAME.W}
        height={FRAME.H}
        style={{ position: "absolute", top: 0, left: 0, width: FRAME.W, height: FRAME.H, objectFit: "cover" }}
      />

      {/* Vertical brass accent line */}
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 380,
          width: 3,
          height: 480,
          backgroundColor: COLOR_BRASS,
          display: "flex",
        }}
      />

      {/* Text block — lower left */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 88,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {filmAndYear && (
          <div
            style={{
              fontSize: 24,
              fontStyle: "italic",
              fontWeight: 400,
              color: COLOR_BRASS,
              letterSpacing: 2.4,
              marginBottom: 18,
              display: "flex",
              textShadow: TEXT_OUTLINE,
            }}
          >
            {filmAndYear}
          </div>
        )}

        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: COLOR_BRASS,
            letterSpacing: 3.4,
            marginBottom: 22,
            display: "flex",
            maxWidth: 860,
            textShadow: TEXT_OUTLINE,
          }}
        >
          {starName}
        </div>

        {/* Slim brass rule */}
        <div
          style={{
            width: 72,
            height: 2,
            backgroundColor: COLOR_BRASS,
            marginBottom: 22,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 22,
            fontStyle: "italic",
            fontWeight: 600,
            color: COLOR_BRASS,
            letterSpacing: 4.4,
            display: "flex",
            textShadow: TEXT_OUTLINE,
          }}
        >
          Shop the Look →
        </div>
      </div>
    </div>
  );
}

// ─── Reel layout — film strip borders with photo between ─────────────────────

function ReelLayout({
  imageUrl,
  starName,
  filmAndYear,
  fontFamily,
}: {
  imageUrl: string;
  starName: string;
  filmAndYear: string | null;
  fontFamily: string;
}) {
  const STRIP_W = 64;
  const PERF_W = 36;
  const PERF_H = 26;
  const PERF_SPACING = 74;
  const PERF_OFFSET_X = (STRIP_W - PERF_W) / 2; // 14px — centers perf in strip
  const perfCount = Math.ceil(FRAME.H / PERF_SPACING) + 1;
  const perfYs = Array.from({ length: perfCount }, (_, i) => 24 + i * PERF_SPACING);

  return (
    <div
      style={{
        width: FRAME.W,
        height: FRAME.H,
        display: "flex",
        position: "relative",
        backgroundColor: COLOR_NAVY,
        fontFamily,
      }}
    >
      {/* Photo — sits between the two strips */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        width={FRAME.W - STRIP_W * 2}
        height={FRAME.H}
        style={{
          position: "absolute",
          left: STRIP_W,
          top: 0,
          width: FRAME.W - STRIP_W * 2,
          height: FRAME.H,
          objectFit: "cover",
        }}
      />

      {/* Subtle bottom gradient for text legibility */}
      <div
        style={{
          position: "absolute",
          left: STRIP_W,
          right: STRIP_W,
          bottom: 0,
          height: 500,
          background: "linear-gradient(to bottom, rgba(4,8,18,0) 0%, rgba(4,8,18,0.80) 100%)",
          display: "flex",
        }}
      />

      {/* Thin brass lines at strip/photo boundaries */}
      <div style={{ position: "absolute", left: STRIP_W, top: 0, width: 2, height: FRAME.H, backgroundColor: COLOR_BRASS, display: "flex" }} />
      <div style={{ position: "absolute", right: STRIP_W, top: 0, width: 2, height: FRAME.H, backgroundColor: COLOR_BRASS, display: "flex" }} />

      {/* Left perforations */}
      {perfYs.map((y, i) => (
        <div
          key={`lp${i}`}
          style={{
            position: "absolute",
            left: PERF_OFFSET_X,
            top: y,
            width: PERF_W,
            height: PERF_H,
            backgroundColor: COLOR_CREAM,
            display: "flex",
          }}
        />
      ))}

      {/* Right perforations */}
      {perfYs.map((y, i) => (
        <div
          key={`rp${i}`}
          style={{
            position: "absolute",
            left: FRAME.W - STRIP_W + PERF_OFFSET_X,
            top: y,
            width: PERF_W,
            height: PERF_H,
            backgroundColor: COLOR_CREAM,
            display: "flex",
          }}
        />
      ))}

      {/* Text block — lower left, inside photo area */}
      <div
        style={{
          position: "absolute",
          left: STRIP_W + 28,
          bottom: 88,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {filmAndYear && (
          <div
            style={{
              fontSize: 24,
              fontStyle: "italic",
              fontWeight: 400,
              color: COLOR_BRASS,
              letterSpacing: 2.4,
              marginBottom: 16,
              display: "flex",
              textShadow: REEL_OUTLINE,
            }}
          >
            {filmAndYear}
          </div>
        )}

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: COLOR_CREAM,
            letterSpacing: 3.2,
            marginBottom: 20,
            display: "flex",
            maxWidth: FRAME.W - STRIP_W * 2 - 56,
            textShadow: REEL_OUTLINE,
          }}
        >
          {starName}
        </div>

        <div
          style={{
            width: 72,
            height: 2,
            backgroundColor: COLOR_BRASS,
            marginBottom: 20,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 21,
            fontStyle: "italic",
            fontWeight: 600,
            color: COLOR_BRASS,
            letterSpacing: 4.2,
            display: "flex",
            textShadow: REEL_OUTLINE,
          }}
        >
          Shop the Look →
        </div>
      </div>
    </div>
  );
}

// ─── Spotlight layout — four-edge vignette simulating a studio spot ───────────

function SpotlightLayout({
  imageUrl,
  starName,
  filmAndYear,
  fontFamily,
}: {
  imageUrl: string;
  starName: string;
  filmAndYear: string | null;
  fontFamily: string;
}) {
  return (
    <div
      style={{
        width: FRAME.W,
        height: FRAME.H,
        display: "flex",
        position: "relative",
        fontFamily,
      }}
    >
      {/* Full-bleed photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        width={FRAME.W}
        height={FRAME.H}
        style={{ position: "absolute", top: 0, left: 0, width: FRAME.W, height: FRAME.H, objectFit: "cover" }}
      />

      {/* Four directional vignettes — corners double-darken, centre stays lit */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 500, background: "linear-gradient(to bottom, rgba(4,8,18,0.88) 0%, rgba(4,8,18,0) 100%)", display: "flex" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 560, background: "linear-gradient(to top, rgba(4,8,18,0.92) 0%, rgba(4,8,18,0) 100%)", display: "flex" }} />
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 300, background: "linear-gradient(to right, rgba(4,8,18,0.78) 0%, rgba(4,8,18,0) 100%)", display: "flex" }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 300, background: "linear-gradient(to left, rgba(4,8,18,0.78) 0%, rgba(4,8,18,0) 100%)", display: "flex" }} />

      {/* Text block — centred, anchored in the bottom dark zone */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {filmAndYear && (
          <div
            style={{
              fontSize: 26,
              fontStyle: "italic",
              fontWeight: 400,
              color: COLOR_BRASS,
              letterSpacing: 2.6,
              marginBottom: 20,
              display: "flex",
              textShadow: TEXT_OUTLINE,
            }}
          >
            {filmAndYear}
          </div>
        )}

        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: COLOR_CREAM,
            letterSpacing: 3.4,
            marginBottom: 24,
            display: "flex",
            textAlign: "center",
            paddingLeft: 60,
            paddingRight: 60,
            textShadow: TEXT_OUTLINE,
          }}
        >
          {starName}
        </div>

        <div
          style={{
            width: 72,
            height: 2,
            backgroundColor: COLOR_BRASS,
            marginBottom: 24,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 22,
            fontStyle: "italic",
            fontWeight: 600,
            color: COLOR_BRASS,
            letterSpacing: 4.4,
            display: "flex",
            textShadow: TEXT_OUTLINE,
          }}
        >
          Shop the Look →
        </div>
      </div>
    </div>
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lookId: string }> }
) {
  const { lookId } = await params;
  const rawTheme = req.nextUrl.searchParams.get("theme");
  const theme: "cream" | "navy" | "brass" | "reel" | "spotlight" =
    rawTheme === "navy"      ? "navy"      :
    rawTheme === "brass"     ? "brass"     :
    rawTheme === "reel"      ? "reel"      :
    rawTheme === "spotlight" ? "spotlight" : "cream";

  try {
    // 1) Admin-auth gate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Fetch look + star
    const { data: look, error: lookErr } = await supabase
      .from("looks")
      .select(
        "id, title, year, year_display, editorial_text, image_url, slug, stars(id, name, slug)"
      )
      .eq("id", lookId)
      .single();

    if (lookErr || !look) {
      console.error("[pin] look query failed:", lookErr);
      return Response.json(
        { error: "Look not found", lookId, supabaseError: lookErr?.message },
        { status: 404 }
      );
    }

    if (!look.image_url) {
      return Response.json(
        { error: "Look has no hero image — cannot generate pin.", lookId },
        { status: 400 }
      );
    }

    const star = look.stars as unknown as { id: string; name: string; slug: string } | null;
    if (!star) {
      return Response.json(
        { error: "Look has no associated star — cannot generate pin.", lookId },
        { status: 400 }
      );
    }

    // 3) Compose text zone content
    // The pin's "film · year" line shows year when no film_title exists.
    // (No film_title column on schema yet — add one to surface a film title.)
    const filmTitle: string | null = null;
    const yearStr =
      look.year_display ?? (look.year ? String(look.year) : null);
    const filmAndYear = filmTitle
      ? yearStr
        ? `${filmTitle} · ${yearStr}`
        : filmTitle
      : yearStr;

    // 4) Assets (M4 mark + fonts)
    const markFile = theme === "cream" ? "M4-mark-primary.png" : "M4-mark-reverse.png";

    const m4Mark = loadM4Mark(markFile);
    const fonts = await loadBodoniFonts();
    const fontFamily =
      fonts.length > 0 ? "Bodoni Moda" : "Georgia, 'Times New Roman', serif";
    // 5) Render — force the buffer so any Satori error is caught here,
    //    not after the response stream starts.
    const response = new ImageResponse(
      theme === "brass" ? (
        <BrassLayout
          imageUrl={look.image_url}
          starName={star.name}
          filmAndYear={filmAndYear}
          fontFamily={fontFamily}
        />
      ) : theme === "reel" ? (
        <ReelLayout
          imageUrl={look.image_url}
          starName={star.name}
          filmAndYear={filmAndYear}
          fontFamily={fontFamily}
        />
      ) : theme === "spotlight" ? (
        <SpotlightLayout
          imageUrl={look.image_url}
          starName={star.name}
          filmAndYear={filmAndYear}
          fontFamily={fontFamily}
        />
      ) : (
        <PinLayout
          imageUrl={look.image_url}
          starName={star.name}
          filmAndYear={filmAndYear}
          fontFamily={fontFamily}
          m4Mark={m4Mark}
          theme={theme}
        />
      ),
      {
        width: FRAME.W,
        height: FRAME.H,
        fonts: fonts.length > 0 ? fonts : undefined,
      }
    );

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Full detail (message + stack) goes to server logs only — never to the
    // response body, which would leak file paths and dependency internals.
    console.error("[pin] handler crashed:", err);
    const isDev = process.env.NODE_ENV !== "production";
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      isDev
        ? { error: "Pin generation failed", detail: message, stack: err instanceof Error ? err.stack : undefined }
        : { error: "Pin generation failed" },
      { status: 500 }
    );
  }
}
