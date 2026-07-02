import { supabase } from "@/integrations/supabase/client";

/**
 * Upload an exchange photo to the private `exchange-photos` bucket as anon/authenticated.
 * Returns the storage path (not a signed URL). The admin server function signs URLs on read.
 */
export async function uploadExchangePhoto(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("exchange-photos").upload(path, file, {
    contentType: file.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
