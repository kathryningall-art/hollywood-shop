-- Seed data: Louise Brooks
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

with inserted_star as (
  insert into stars (name, slug, bio, hero_image_url, hero_image_credit, death_year, publicity_rights_risk, publicity_rights_notes)
  values (
    'Louise Brooks',
    'louise-brooks',
    'Louise Brooks was the quintessential flapper — a silent-screen actress whose sharp black bob and restless intelligence became the defining image of the Jazz Age. Born in Kansas in 1906, she moved to New York to dance with the Denishawn company before Hollywood beckoned. Her most celebrated work came in Germany: G.W. Pabst cast her in Pandora''s Box (1929), where she played Lulu with an unsettling, modern frankness that still feels ahead of its time.',
    'https://upload.wikimedia.org/wikipedia/commons/9/9e/Brooks_Louise_Richee.jpg',
    'Portrait by Eugene Robert Richee, c. 1928. Public domain (PD-US-no_notice). Wikimedia Commons.',
    1985,
    'low'::publicity_rights_risk,
    'Estate not known to enforce commercially. Pre-1930 images are clear public domain in the US.'
  )
  returning id
),

inserted_look1 as (
  insert into looks (star_id, slug, title, year, image_url, image_credit, image_source_url, image_license, license_verified, license_verification_notes, editorial_text, published)
  select
    id,
    'pandoras-box-1929',
    'Pandora''s Box — the Lulu look',
    1929,
    'https://upload.wikimedia.org/wikipedia/commons/8/85/Brooks%2C_PB.jpg',
    'Publicity still from Pandora''s Box (1929), dir. G.W. Pabst. Nero-Film AG. Public domain (PD-US-not_renewed). Wikimedia Commons.',
    'https://commons.wikimedia.org/wiki/File:Brooks,_PB.jpg',
    'public_domain_us'::image_license,
    true,
    'Wikimedia Commons tag: PD-US-not_renewed. US copyright not renewed. Pre-1964 film material.',
    'The look that launched a thousand bobs. For Pandora''s Box, Pabst kept Brooks almost entirely in black — spare, modern, deliberately jarring against the expressionist excess around her. The dropped waist, the knife-pleated skirt, the way a single strand of pearls sat against a dark beaded bodice: this was 1929 knowing it was inventing something. The bob itself was already a statement before the film; on film, with Curt Courant''s lighting finding every angle, it became an archetype. Contemporary takes on this look work best when they resist the costume impulse — one strong silhouette element, the right jewelry, the hair doing the heavy lifting.',
    true
  from inserted_star
  returning id
),

inserted_look2 as (
  insert into looks (star_id, slug, title, year, image_url, image_credit, image_source_url, image_license, license_verified, license_verification_notes, editorial_text, published)
  select
    inserted_star.id,
    'beggars-of-life-1928',
    'Beggars of Life — the runaway look',
    1928,
    'https://upload.wikimedia.org/wikipedia/commons/0/08/Beggars_of_Life_mp129.jpg',
    'Publicity still for Beggars of Life (1928), dir. William Wellman. Paramount Pictures. Public domain (PD-US-no_notice). Wikimedia Commons.',
    'https://commons.wikimedia.org/wiki/File:Beggars_of_Life_mp129.jpg',
    'public_domain_us'::image_license,
    true,
    'Wikimedia Commons tag: PD-US-no_notice. Published in the US before 1978 without copyright notice.',
    'Beggars of Life gave Brooks something rare for a 1928 leading lady: trousers. Playing a girl who disguises herself as a boy to escape a murder charge, she wears wide-leg work pants, a loose shirt, and a flat cap — an accidental uniform for every decade that followed. The paradox is that the masculine clothes only emphasise how unconvincing the disguise is, which was the point. For modern wear, the lesson from this look is proportion: the wide trouser needs a close-fitting top, and the whole thing needs one rough-edged accessory to keep it from feeling precious.',
    true
  from inserted_star
  returning id
),

inserted_products1 as (
  insert into products (look_id, title, retailer, price_display, affiliate_url, network, display_order)
  select id, 'Drop-waist flapper dress in black, beaded fringe', 'Etsy', '$85–$220', '#', 'etsy'::affiliate_network, 1 from inserted_look1
  union all
  select id, 'Art deco rhinestone bar brooch, geometric', 'Etsy', '$28–$75', '#', 'etsy'::affiliate_network, 2 from inserted_look1
  union all
  select id, 'Long rope pearl necklace, layerable strand', 'Amazon', '$18–$45', '#', 'amazon'::affiliate_network, 3 from inserted_look1
  union all
  select id, 'T-strap Mary Jane heels, black satin', 'Nordstrom', '$95–$175', '#', 'nordstrom'::affiliate_network, 4 from inserted_look1
)

insert into products (look_id, title, retailer, price_display, affiliate_url, network, display_order)
select id, 'Wide-leg linen trousers, cream or ivory', 'Nordstrom', '$65–$140', '#', 'nordstrom'::affiliate_network, 1 from inserted_look2
union all
select id, 'Flat newsboy cap, wool herringbone', 'Etsy', '$35–$90', '#', 'etsy'::affiliate_network, 2 from inserted_look2
union all
select id, 'Cropped white cotton shirt, relaxed fit', 'Amazon', '$22–$48', '#', 'amazon'::affiliate_network, 3 from inserted_look2;
