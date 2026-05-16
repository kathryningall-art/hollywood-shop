-- Batch 2 seed: Katharine Hepburn (new), Carole Lombard (new), Louise Brooks (8 new looks)
-- All looks: published=false, license_verified=true, editorial_text=NULL

-- ── STARS ────────────────────────────────────────────────────────────────────

INSERT INTO stars (name, slug, bio, hero_image_url, hero_image_credit, death_year, publicity_rights_risk, publicity_rights_notes)
VALUES
  (
    'Katharine Hepburn',
    'katharine-hepburn',
    '',
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Katharine_Hepburn_publicity_photograph.jpg',
    'Wikimedia Commons',
    2003,
    'low'::publicity_rights_risk,
    'Died in Connecticut (no statutory post-mortem right of publicity). Estate executed by family and personal friends, not a licensing firm. No known aggressive enforcement of likeness rights.'
  ),
  (
    'Carole Lombard',
    'carole-lombard',
    '',
    'https://upload.wikimedia.org/wikipedia/commons/9/94/Carole_Lombard_1935_portrait.jpg',
    'Wikimedia Commons',
    1942,
    'low'::publicity_rights_risk,
    'Died young (1942), no licensing firm representation. Many 1930s publicity stills in public domain due to non-renewal of copyright.'
  );

-- ── LOOKS ────────────────────────────────────────────────────────────────────

INSERT INTO looks (
  star_id, slug, title, year,
  image_url, image_credit, image_source_url,
  image_license, license_verified, license_verification_notes,
  editorial_text, published
)
VALUES

-- ── KATHARINE HEPBURN (10 looks) ─────────────────────────────────────────────

(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'mgm-studio-portrait-1941',
  'MGM Studio Portrait, 1941',
  1941,
  'https://upload.wikimedia.org/wikipedia/commons/8/89/Katharine_Hepburn_publicity_photograph.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Katharine_Hepburn_publicity_photograph.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'glamour-portrait-mgm',
  'Glamour Portrait, MGM',
  1941,
  'https://upload.wikimedia.org/wikipedia/commons/b/b4/Katharine-Hepburn-MGM.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Katharine-Hepburn-MGM.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'checkered-jacket-woman-of-the-year',
  'Checkered Jacket, Woman of the Year',
  1942,
  'https://upload.wikimedia.org/wikipedia/commons/f/ff/Katharine_hepburn_woman_of_the_year.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Katharine_hepburn_woman_of_the_year.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'black-velvet-promo-portrait',
  'Black Velvet Promo Portrait',
  1938,
  'https://upload.wikimedia.org/wikipedia/commons/3/39/Katharine_Hepburn_promo_pic_2.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Katharine_Hepburn_promo_pic_2.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'mary-janes-bringing-up-baby',
  'Mary Janes, Bringing Up Baby',
  1938,
  'https://upload.wikimedia.org/wikipedia/commons/f/ff/Katharine_Hepburn_in_Bringing_Up_Baby_publicity_still.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Katharine_Hepburn_in_Bringing_Up_Baby_publicity_still.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'red-stripe-stage-cover',
  'Red Stripe Stage Cover',
  1939,
  'https://upload.wikimedia.org/wikipedia/commons/7/72/Hepburn-FC-Stage-1939.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Hepburn-FC-Stage-1939.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'backstage-bringing-up-baby',
  'Backstage, Bringing Up Baby',
  1938,
  'https://upload.wikimedia.org/wikipedia/commons/e/e1/Backstage_photo_of_Bringing_Up_Baby.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Backstage_photo_of_Bringing_Up_Baby.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'white-blouse-scene-holiday',
  'White Blouse Scene, Holiday',
  1938,
  'https://upload.wikimedia.org/wikipedia/commons/a/a1/Holiday-Nolan-Grant-Hepburn.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Holiday-Nolan-Grant-Hepburn.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'checkered-dress-philadelphia-story',
  'Checkered Dress, Philadelphia Story',
  1940,
  'https://upload.wikimedia.org/wikipedia/commons/5/50/Philadelphia-Story-Stage-4.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Philadelphia-Story-Stage-4.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'katharine-hepburn'),
  'cyclamen-gown-philadelphia-story',
  'Cyclamen Gown, Philadelphia Story',
  1940,
  'https://upload.wikimedia.org/wikipedia/commons/e/ea/Philadelphia-Story-Stage-1.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Philadelphia-Story-Stage-1.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),

-- ── LOUISE BROOKS (8 new looks) ──────────────────────────────────────────────

(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'black-jacket-white-suit',
  'Black Jacket and White Suit',
  1926,
  'https://upload.wikimedia.org/wikipedia/commons/c/c0/Louise_Brooks_suit%2C_ca._1926.png',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Louise_Brooks_suit%2C_ca._1926.png',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'day-dress-portrait-1925',
  'Day Dress Portrait, 1925',
  1925,
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Brooks-Louise_ca._1925.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Brooks-Louise_ca._1925.jpg',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'coat-hat-and-dress',
  'Coat, Hat, and Dress',
  1927,
  'https://upload.wikimedia.org/wikipedia/commons/9/92/Louise_Brooks_LCCN2014712606.jpg',
  'Library of Congress via Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Louise_Brooks_LCCN2014712606.jpg',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'embellished-evening-top',
  'Embellished Evening Top',
  1927,
  'https://upload.wikimedia.org/wikipedia/commons/2/21/LB_1927_P703-69.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:LB_1927_P703-69.jpg',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'printed-blouse-portrait',
  'Printed Blouse Portrait',
  1927,
  'https://upload.wikimedia.org/wikipedia/commons/9/99/LB_1927_P703-94.webp',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:LB_1927_P703-94.webp',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'color-blocked-knit-top',
  'Color-Blocked Knit Top',
  1927,
  'https://upload.wikimedia.org/wikipedia/commons/2/27/LB_cambridge_front%2C_ca._1927.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:LB_cambridge_front%2C_ca._1927.jpg',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'glittered-one-shoulder-evening',
  'Glittered One-Shoulder Evening',
  1927,
  'https://upload.wikimedia.org/wikipedia/commons/e/ec/LB_1927_P703-83.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:LB_1927_P703-83.jpg',
  'PD-US-no_notice', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'louise-brooks'),
  'chain-necklace-pandoras-box',
  'Chain Necklace, Pandora''s Box',
  1929,
  'https://upload.wikimedia.org/wikipedia/commons/c/cd/Louise_Brooks_Pandora%27s_Box_2.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Louise_Brooks_Pandora%27s_Box_2.jpg',
  'PD-1996', true,
  'Dual US/Germany PD status — verified on Wikimedia file page',
  '', false
),

-- ── CAROLE LOMBARD (8 looks) ──────────────────────────────────────────────────

(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'black-jacket-portrait-1935',
  'Black Jacket Portrait, 1935',
  1935,
  'https://upload.wikimedia.org/wikipedia/commons/9/94/Carole_Lombard_1935_portrait.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard_1935_portrait.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'white-chiffon-dress-1929',
  'White Chiffon Dress, 1929',
  1929,
  'https://upload.wikimedia.org/wikipedia/commons/3/3e/Carole_Lombard_by_Edwin_Bower_Hesser_1929.jpg',
  'Edwin Bower Hesser via Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard_by_Edwin_Bower_Hesser_1929.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'silk-evening-gown-1933',
  'Silk Evening Gown, 1933',
  1933,
  'https://upload.wikimedia.org/wikipedia/commons/2/24/Carole_Lombard.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'yellow-blazer-portrait',
  'Yellow Blazer Portrait',
  1939,
  'https://upload.wikimedia.org/wikipedia/commons/2/2b/Carole_Lombard_1939.JPG',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard_1939.JPG',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'patterned-silk-magazine-ad',
  'Patterned Silk, Magazine Ad',
  1938,
  'https://upload.wikimedia.org/wikipedia/commons/f/fc/Carole_Lombard_Argentinean_Magazine_AD_2.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard_Argentinean_Magazine_AD_2.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'white-suit-publicity-portrait',
  'White Suit Publicity Portrait',
  1935,
  'https://upload.wikimedia.org/wikipedia/commons/7/72/Carole_Lombard_publicity.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard_publicity.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'red-silk-top-photoplay-cover',
  'Red Silk Top, Photoplay Cover',
  1940,
  'https://upload.wikimedia.org/wikipedia/commons/e/e9/Photoplay_Carole_Lombard_1940.jpg',
  'Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Photoplay_Carole_Lombard_1940.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
),
(
  (SELECT id FROM stars WHERE slug = 'carole-lombard'),
  'travis-banton-green-gown',
  'Travis Banton Green Gown',
  1936,
  'https://upload.wikimedia.org/wikipedia/commons/8/8b/Carole_Lombard_in_a_gown_Travis_Banton_designed_for_her_personal_wardrobe%2C_1936.jpg',
  'Travis Banton design, photographer unknown, via Wikimedia Commons',
  'https://commons.wikimedia.org/wiki/File:Carole_Lombard_in_a_gown_Travis_Banton_designed_for_her_personal_wardrobe%2C_1936.jpg',
  'PD-US-not_renewed', true,
  'User-verified Public Domain via Wikimedia Commons file page',
  '', false
);

-- ── VERIFICATION ──────────────────────────────────────────────────────────────

SELECT 'Stars created' AS check, count(*) AS n
FROM stars WHERE slug IN ('katharine-hepburn', 'carole-lombard')
UNION ALL
SELECT 'Looks added (Hepburn)', count(*)
FROM looks l JOIN stars s ON s.id = l.star_id WHERE s.slug = 'katharine-hepburn'
UNION ALL
SELECT 'Looks added (Brooks new)', count(*)
FROM looks l JOIN stars s ON s.id = l.star_id
WHERE s.slug = 'louise-brooks'
  AND l.slug IN (
    'black-jacket-white-suit','day-dress-portrait-1925','coat-hat-and-dress',
    'embellished-evening-top','printed-blouse-portrait','color-blocked-knit-top',
    'glittered-one-shoulder-evening','chain-necklace-pandoras-box'
  )
UNION ALL
SELECT 'Looks added (Lombard)', count(*)
FROM looks l JOIN stars s ON s.id = l.star_id WHERE s.slug = 'carole-lombard'
UNION ALL
SELECT 'All unpublished', count(*)
FROM looks l JOIN stars s ON s.id = l.star_id
WHERE s.slug IN ('katharine-hepburn','carole-lombard','louise-brooks')
  AND l.published = false
  AND l.slug IN (
    'mgm-studio-portrait-1941','glamour-portrait-mgm','checkered-jacket-woman-of-the-year',
    'black-velvet-promo-portrait','mary-janes-bringing-up-baby','red-stripe-stage-cover',
    'backstage-bringing-up-baby','white-blouse-scene-holiday','checkered-dress-philadelphia-story',
    'cyclamen-gown-philadelphia-story',
    'black-jacket-white-suit','day-dress-portrait-1925','coat-hat-and-dress',
    'embellished-evening-top','printed-blouse-portrait','color-blocked-knit-top',
    'glittered-one-shoulder-evening','chain-necklace-pandoras-box',
    'black-jacket-portrait-1935','white-chiffon-dress-1929','silk-evening-gown-1933',
    'yellow-blazer-portrait','patterned-silk-magazine-ad','white-suit-publicity-portrait',
    'red-silk-top-photoplay-cover','travis-banton-green-gown'
  )
UNION ALL
SELECT 'All editorial_text null', count(*)
FROM looks l JOIN stars s ON s.id = l.star_id
WHERE s.slug IN ('katharine-hepburn','carole-lombard')
  AND l.editorial_text IS NULL;
