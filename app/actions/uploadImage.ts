"use server";

import { createClient } from "@supabase/supabase-js";

export async function uploadImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) ?? "misc";

  if (!file) return { error: "No file provided" };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ext = file.name.split(".").pop();
  const filename = `${folder}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (error || !data) return { error: error?.message ?? "Upload failed" };

  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(data.path);

  return { url: publicUrl };
}
