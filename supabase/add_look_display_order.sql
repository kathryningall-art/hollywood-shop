-- Add display_order to looks, initialize from year ascending per star
ALTER TABLE looks ADD COLUMN display_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id,
    (row_number() OVER (PARTITION BY star_id ORDER BY year ASC NULLS LAST) - 1) AS rn
  FROM looks
)
UPDATE looks SET display_order = ordered.rn
FROM ordered WHERE looks.id = ordered.id;
