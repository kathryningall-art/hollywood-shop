import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminStarsTable from "./AdminStarsTable";
import AdminLooksTable from "./AdminLooksTable";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: stars }, { data: looks }] = await Promise.all([
    supabase
      .from("stars")
      .select("id, name, slug, publicity_rights_risk, display_order")
      .order("display_order"),
    supabase
      .from("looks")
      .select("id, title, year, published, license_verified, star_id, display_order, stars(name)")
      .order("display_order"),
  ]);

  return (
    <div className="space-y-12">
      {/* Stars */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-serif text-navy text-2xl">Stars</h1>
          <Link
            href="/admin/stars/new"
            className="bg-navy text-cream text-xs tracking-widest uppercase px-4 py-2 hover:bg-brass transition-colors"
          >
            + Add Star
          </Link>
        </div>

        {!stars?.length ? (
          <p className="text-navy/50 text-sm italic">No stars yet.</p>
        ) : (
          <AdminStarsTable initialStars={stars} />
        )}
      </section>

      {/* Looks */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-serif text-navy text-2xl">Looks</h1>
          <Link
            href="/admin/looks/new"
            className="bg-navy text-cream text-xs tracking-widest uppercase px-4 py-2 hover:bg-brass transition-colors"
          >
            + Add Look
          </Link>
        </div>

        {!looks?.length ? (
          <p className="text-navy/50 text-sm italic">No looks yet.</p>
        ) : (
          <AdminLooksTable
            initialLooks={looks.map((l) => ({
              id: l.id,
              title: l.title,
              year: l.year,
              published: l.published,
              license_verified: l.license_verified,
              star_id: l.star_id,
              star_name: (l.stars as unknown as { name: string } | null)?.name ?? "—",
              display_order: l.display_order,
            }))}
          />
        )}
      </section>
    </div>
  );
}
