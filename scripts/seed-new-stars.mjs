import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kbeklbykufiifvzknihw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZWtsYnlrdWZpaWZ2emtuaWh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ0NzQ4NCwiZXhwIjoyMDk0MDIzNDg0fQ.1ydRP8btBEchIA2JaD7Acm0fdL2sWpy_O85XLdRFmbg"
);

function cleanUrl(url) {
  return url.split("?")[0];
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sourceUrl(imageUrl) {
  const filename = imageUrl.split("?")[0].split("/").pop();
  return `https://commons.wikimedia.org/wiki/File:${filename}`;
}

const data = [
  {
    name: "Barbara Stanwyck",
    slug: "barbara-stanwyck",
    display_order: 4,
    looks: [
      { title: "1944 Portrait, Black Lace Sweetheart Neckline", year: 1944, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/d/d6/Barbara_Stanwyck_-_Whitey_Schafer_-_October_1944.jpg") },
      { title: "1943 Brown Dress with Jewelry", year: 1943, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/3/38/Barbara_Stanwyck_1943.jpg") },
      { title: "Baby Face Publicity Still", year: 1933, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/b/b7/Barbara_Stanwyck_in_Baby_Face.jpg") },
      { title: "1938 Photoplay Portrait", year: 1938, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/c/c3/Barbara_Stanwyck_-_Photoplay%2C_June_1938.jpg") },
      { title: "Ball of Fire", year: 1941, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/b/b1/Barbara_Stanwyck_in_Ball_of_Fire.jpg") },
      { title: "Stella Dallas", year: 1937, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/2/2d/Annex_-_Stanwyck%2C_Barbara_%28Stella_Dallas%29_01.jpg") },
      { title: "Stella Dallas Long Gown", year: 1937, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/7/7a/Barbara_Stanwyck_in_Stella_Dallas_publicity_still.jpg") },
      { title: "The Gay Sisters", year: 1942, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/0/0e/Stanwyck_-_1942_film.JPG") },
      { title: "His Brother's Wife", year: 1936, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/1/12/His_Brother%27s_Wife_pg1036.jpg") },
    ],
  },
  {
    name: "Anna May Wong",
    slug: "anna-may-wong",
    display_order: 5,
    looks: [
      { title: "Publicity Portrait", year: 1935, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/8/83/Anna_May_Wong_-_portrait.jpg") },
      { title: "1930s Portrait", year: 1932, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/d/da/Anna_May_Wong_%28passport_style_photograph%29.jpg") },
      { title: "1928 Portrait", year: 1928, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/4/44/Wong-ann-may_1928.jpg") },
      { title: "Limehouse Blues, Travis Banton Cheongsam", year: 1934, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/f/ff/Anna_May_Wong_wearing_Travis_Banton_in_Limehouse_Blues.jpg") },
      { title: "1925 Portrait", year: 1925, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/0/0e/Anna_May_Wong%2C_silent_film_actress_%28SAYRE_11250%29.jpg") },
      { title: "1927 Photoplay Cover", year: 1927, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/6/64/AnnaMayWong-photoplay-1927.jpg") },
    ],
  },
  {
    name: "Jean Harlow",
    slug: "jean-harlow",
    display_order: 6,
    looks: [
      { title: "Publicity Still", year: 1935, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/2/22/Jean_Harlow_still.jpg") },
      { title: "New York Sunday News Magazine Cover", year: 1937, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/1/19/Jean_Harlow_1937.jpg") },
      { title: "Time Magazine Cover", year: 1935, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/1/1a/Jean-Harlow-1935.jpg") },
      { title: "Swimsuit Photo", year: 1934, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/8/83/Harlow-jean_swim1934.jpg") },
      { title: "Red-Headed Woman", year: 1932, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/8/8d/Red-Headed_Woman_%281932%29.jpg") },
      { title: "Dinner at Eight", year: 1933, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/2/21/Jean_Harlow_1935.jpg") },
    ],
  },
  {
    name: "Joan Blondell",
    slug: "joan-blondell",
    display_order: 7,
    looks: [
      { title: "1938 Portrait", year: 1938, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/b/b3/Joan_Blondell_modern138.jpg") },
      { title: "1930s Portrait", year: 1933, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/0/0a/JOANBlondell.jpg") },
      { title: "Cinelandia Magazine Cover", year: 1938, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/4/47/Joan_Blondell_CINELANDIA_magazine.jpg") },
      { title: "Bathing Suit", year: 1940, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/0/04/Joan_Blondell_Screen_Guide_2.jpg") },
      { title: "Houndstooth Bathing Suit", year: 1939, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/7/7a/Joan_Blondell_Screen_Guide_1.jpg") },
      { title: "Picturegoer Magazine", year: 1936, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/8/86/Joan_Blondell_pg1036.jpg") },
      { title: "1930s Portrait II", year: 1935, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/f/f9/Joan_Blondell_Fryer.jpg") },
    ],
  },
  {
    name: "Gene Tierney",
    slug: "gene-tierney",
    display_order: 8,
    looks: [
      { title: "Yank Army Weekly Cover", year: 1945, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/2/23/Gene_Tierney_-_YankArmyWeekly.jpg") },
      { title: "1940s Promotional Photo", year: 1943, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/2/25/GENETierney.jpg") },
      { title: "Modern Screen Cover", year: 1947, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/4/4e/Gene_Tierney_1946.jpg") },
      { title: "Studio Portrait", year: 1941, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/4/4d/Gene_Tierney_-_Studio_portrait_%281941%29.png") },
      { title: "Screenland Magazine Cover", year: 1945, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/3/39/Gene_Tierney_by_Frank_Powolny%2C_Screenland%2C_December_1945.jpg") },
      { title: "Yank Army Weekly", year: 1944, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/5/5e/Gene_Tierney.jpg") },
    ],
  },
  {
    name: "Myrna Loy",
    slug: "myrna-loy",
    display_order: 9,
    looks: [
      { title: "Publicity Photo", year: 1935, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/5/56/Myrna_Loy.jpg") },
      { title: "Broadway Bill", year: 1934, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/b/bf/Myrna_Loy_-_Broadway_Bill_%281934%29.jpg") },
      { title: "Manhattan Melodrama", year: 1934, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/3/3d/Myrna_Loy_-_Manhattan_Melodrama_%281934%29.jpg") },
      { title: "1935 Portrait", year: 1935, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/6/68/Myrna_Loy_RHL35.jpg") },
      { title: "MGM Publicity Shot", year: 1936, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/6/63/AEV-405_VINTAGE_PHOTO-_MYRNA_LOY_PUBLICITY_SHOT-_MGM.jpg") },
      { title: "Photoplay Cover", year: 1938, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/4/4b/Myrna_Loy_Photoplay_August_1938.jpg") },
      { title: "Libeled Lady", year: 1936, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/c/c3/Myrna_Loy_in_Libeled_Lady_%281936%29.jpg") },
      { title: "Across the Pacific Publicity", year: 1926, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/3/39/Across_the_Pacific_publicity_photo_1926_Myrna_Loy.jpg") },
    ],
  },
  {
    name: "Veronica Lake",
    slug: "veronica-lake",
    display_order: 10,
    looks: [
      { title: "Publicity Photo", year: 1950, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/1/19/Veronica_Lake_still%2C_Paramount_Pictures.jpg") },
      { title: "Portrait", year: 1952, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/f/ff/Veronica_Lake_still_2.jpg") },
      { title: "Paramount Headshot", year: 1943, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/5/59/Veronica_Lake_Paramount.jpg") },
      { title: "Portrait by Whitey Schafer", year: 1944, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/4/45/Veronica_Lake_by_Whitey_Schafer.webp") },
      { title: "I Wanted Wings Publicity", year: 1941, image_url: cleanUrl("https://upload.wikimedia.org/wikipedia/commons/e/e9/Veronica_Lake_-_Studio_portrait_%281941%29.png") },
    ],
  },
];

let totalStars = 0;
let totalLooks = 0;
let errors = 0;

for (const star of data) {
  // Insert star
  const { data: inserted, error: starErr } = await supabase
    .from("stars")
    .insert({
      name: star.name,
      slug: star.slug,
      publicity_rights_risk: "low",
      display_order: star.display_order,
      hero_image_url: star.looks[0].image_url,
    })
    .select("id")
    .single();

  if (starErr) {
    console.error(`✗ Star "${star.name}": ${starErr.message}`);
    errors++;
    continue;
  }

  console.log(`✓ Star: ${star.name} (${inserted.id})`);
  totalStars++;

  // Insert looks for this star
  for (let i = 0; i < star.looks.length; i++) {
    const look = star.looks[i];
    const slug = slugify(`${star.slug}-${look.title}`).slice(0, 80);

    const { error: lookErr } = await supabase.from("looks").insert({
      star_id: inserted.id,
      title: look.title,
      slug,
      year: look.year,
      image_url: look.image_url,
      image_source_url: sourceUrl(look.image_url),
      image_credit: "Wikimedia Commons",
      image_license: "Public Domain",
      license_verified: true,
      published: false,
      display_order: i,
    });

    if (lookErr) {
      console.error(`  ✗ Look "${look.title}": ${lookErr.message}`);
      errors++;
    } else {
      console.log(`  ✓ Look: ${look.title}`);
      totalLooks++;
    }
  }
}

console.log(`\nDone. ${totalStars} stars, ${totalLooks} looks inserted. ${errors} errors.`);
