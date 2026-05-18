export type MatchTier = "original_era" | "vintage_reproduction" | "modern_inspired";

export default function ProductFrame({
  tier,
  children,
}: {
  tier: MatchTier;
  children: React.ReactNode;
}) {
  return <div className="frame-modern">{children}</div>;
}

/** Tiny swatch for admin tier picker — shows frame styling without a real image */
export function FrameSwatch({ tier }: { tier: MatchTier }) {
  const inner = <div style={{ width: "100%", height: "100%", background: "#d6cfc4", borderRadius: tier === "modern_inspired" ? 4 : 0 }} />;
  if (tier === "original_era") {
    return (
      <div
        style={{
          position: "relative", width: 28, height: 36, padding: 4,
          background: "#faf8f4", border: "2px solid #B89752", borderRadius: 2,
          boxShadow: "inset 0 0 0 1px #faf8f4, inset 0 0 0 2px #D4B26A, inset 0 0 0 3px #B89752",
          flexShrink: 0,
        }}
      >
        {inner}
      </div>
    );
  }
  if (tier === "vintage_reproduction") {
    return (
      <div
        style={{
          position: "relative", width: 28, height: 36, padding: 4,
          background: "#faf8f4", border: "1.5px solid #735834", borderRadius: 1,
          boxShadow: "inset 0 0 0 1px #faf8f4, inset 0 0 0 2px #8B6F47",
          flexShrink: 0,
        }}
      >
        {inner}
        {/* mini ziggurat steps */}
        {[0,1,2].map((i) => (
          <span key={i} style={{ position: "absolute", top: 1 + i, left: 1, width: 5 - i * 1.5, height: 1, background: "#5D4423" }} />
        ))}
      </div>
    );
  }
  return (
    <div
      style={{
        width: 28, height: 36, padding: 4,
        background: "#faf8f4", border: "1px solid #2C2C2A", borderRadius: 8,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}
    >
      {inner}
    </div>
  );
}
