import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Upload a file to a private bucket and return a long-lived signed URL. */
export async function uploadImage(bucket: "product-images" | "blog-images", file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(safeName, file, {
    contentType: file.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(safeName, TEN_YEARS);
  if (sErr || !data?.signedUrl) throw sErr ?? new Error("signed url failed");
  return data.signedUrl;
}
