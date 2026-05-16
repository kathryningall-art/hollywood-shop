-- Add display_order to stars, initialize from current alphabetical order
ALTER TABLE stars ADD COLUMN display_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, (row_number() OVER (ORDER BY name) - 1) AS rn
  FROM stars
)
UPDATE stars SET display_order = ordered.rn
FROM ordered WHERE stars.id = ordered.id;
