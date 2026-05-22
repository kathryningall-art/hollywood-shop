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

  // Prefer truetype, fall back to opentype.
  const match =
    css.match(/src:\s*url\((https:[^)]+)\)\s*format\('truetype'\)/) ||
    css.match(/src:\s*url\((https:[^)]+)\)\s*format\('opentype'\)/);
  if (!match) {
    throw new Error(
      `No TTF/OTF URL found in CSS for ${family} ${weight}${italic ? "i" : ""}`
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

let m4MarkDataUrl: string | null = null;
let m4MarkChecked = false;

function loadM4Mark(): string | null {
  if (m4MarkChecked) return m4MarkDataUrl;
  m4MarkChecked = true;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public/brand/M4-mark-primary.png"));
    m4MarkDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("[pin] M4 mark missing — pin will render without it:", err);
    m4MarkDataUrl = null;
  }
  return m4MarkDataUrl;
}

// ─── Pin layout (JSX for ImageResponse / Satori) ──────────────────────────────

function PinLayout({
  imageUrl,
  starName,
  filmAndYear,
  fontFamily,
  m4Mark,
}: {
  imageUrl: string;
  starName: string;
  filmAndYear: string | null;
  fontFamily: string;
  m4Mark: string | null;
}) {
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
        backgroundColor: COLOR_CREAM,
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
          justifyContent: "center",
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
            color: COLOR_NAVY,
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
            height={66}
            style={{ height: 66, width: "auto" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lookId: string }> }
) {
  const { lookId } = await params;

  try {
    console.log("[pin] generating for lookId:", lookId);

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

    console.log("[pin] data ok, loading assets...");

    // 3) Compose text zone content
    // No film_title column on the schema → film/year line is always omitted for now.
    const filmAndYear: string | null = null;

    // 4) Assets (M4 mark + fonts)
    const m4Mark = loadM4Mark();
    const fonts = await loadBodoniFonts();
    const fontFamily =
      fonts.length > 0 ? "Bodoni Moda" : "Georgia, 'Times New Roman', serif";
    console.log("[pin] assets ready. fonts:", fonts.length, "m4Mark:", !!m4Mark);

    // 5) Render — force the buffer so any Satori error is caught here,
    //    not after the response stream starts.
    console.log("[pin] rendering ImageResponse...");
    const response = new ImageResponse(
      (
        <PinLayout
          imageUrl={look.image_url}
          starName={star.name}
          filmAndYear={filmAndYear}
          fontFamily={fontFamily}
          m4Mark={m4Mark}
        />
      ),
      {
        width: FRAME.W,
        height: FRAME.H,
        fonts: fonts.length > 0 ? fonts : undefined,
      }
    );

    console.log("[pin] forcing buffer to catch Satori errors...");
    const buffer = await response.arrayBuffer();
    console.log("[pin] success — buffer size:", buffer.byteLength);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[pin] handler crashed:", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return Response.json(
      { error: "Pin generation failed", detail: message, stack },
      { status: 500 }
    );
  }
}
