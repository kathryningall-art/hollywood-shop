-- Add match_tier to products
ALTER TABLE products
  ADD COLUMN match_tier text
    NOT NULL DEFAULT 'modern_inspired'
    CHECK (match_tier IN ('original_era', 'vintage_reproduction', 'modern_inspired'));

-- Existing products default to modern_inspired (safe fallback — admin will correct)
-- Remove default so future inserts from admin must explicitly set a tier
ALTER TABLE products ALTER COLUMN match_tier DROP DEFAULT;
