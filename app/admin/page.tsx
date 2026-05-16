import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminStarsTable from "./AdminStarsTable";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: stars }, { data: looks }] = await Promise.all([
    supabase
      .from("stars")
      .select("id, name, slug, publicity_rights_risk, display_order")
      .order("display_order"),
    supabase
      .from("looks")
      .select("id, title, year, published, license_verified, star_id, stars(name)")
      .order("year"),
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
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-navy/20 text-xs tracking-widest uppercase text-navy/50">
                <th className="text-left py-2 pr-4 font-normal">Title</th>
                <th className="text-left py-2 pr-4 font-normal">Star</th>
                <th className="text-left py-2 pr-4 font-normal">Year</th>
                <th className="text-left py-2 pr-4 font-normal">License</th>
                <th className="text-left py-2 pr-4 font-normal">Status</th>
                <th className="py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {looks.map((look) => (
                <tr key={look.id} className="border-b border-navy/10 hover:bg-cream/50">
                  <td className="py-3 pr-4 text-navy font-medium">{look.title}</td>
                  <td className="py-3 pr-4 text-navy/60">
                    {(look.stars as unknown as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-navy/60">{look.year}</td>
                  <td className="py-3 pr-4">
                    {look.license_verified ? (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-sm font-medium">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm font-medium">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {look.published ? (
                      <span className="text-xs text-navy bg-brass/20 px-2 py-0.5 rounded-sm font-medium uppercase tracking-wide">
                        Live
                      </span>
                    ) : (
                      <span className="text-xs text-navy/40 bg-navy/10 px-2 py-0.5 rounded-sm font-medium uppercase tracking-wide">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/looks/${look.id}`}
                      className="text-xs text-brass hover:text-navy uppercase tracking-widest"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
