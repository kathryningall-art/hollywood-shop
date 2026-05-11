"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminNav({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="bg-navy text-cream border-b border-brass/30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-serif text-lg tracking-wide">Dressed in Silver</span>
          <span className="text-brass/50">◆</span>
          <nav className="flex items-center gap-5 text-xs tracking-widest uppercase">
            <Link href="/admin" className="hover:text-brass transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/stars/new" className="hover:text-brass transition-colors">
              Add Star
            </Link>
            <Link href="/admin/looks/new" className="hover:text-brass transition-colors">
              Add Look
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs text-cream/60">
          <span>{email}</span>
          <button
            onClick={handleSignOut}
            className="text-brass hover:text-cream transition-colors tracking-widest uppercase"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
