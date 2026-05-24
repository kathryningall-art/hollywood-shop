import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Use ONLY from trusted server code
// (background workers, cache layer). Never expose to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
