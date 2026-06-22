import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "site-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

async function compressToWebp(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bmp = await createImageBitmap(file);
  const maxW = 1920;
  const scale = Math.min(1, maxW / bmp.width);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0, w, h);
  return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/webp", 0.85));
}

async function signedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  return data?.signedUrl ?? "";
}

export async function uploadSiteImage(file: File): Promise<string> {
  const blob = await compressToWebp(file);
  const name = `${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(name, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return await signedUrl(name);
}

export function MediaLibrary({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (url: string) => void;
}) {
  const [items, setItems] = useState<Array<{ name: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const list = await Promise.all((data ?? []).filter((f) => f.name && !f.name.startsWith(".")).map(async (f) => ({ name: f.name, url: await signedUrl(f.name) })));
      setItems(list);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) void load(); }, [open]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) await uploadSiteImage(f);
      toast.success("Image téléversée");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bibliothèque média</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{items.length} image(s)</p>
          <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Téléverser
          </Button>
          <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {items.map((it) => (
                <button
                  key={it.name}
                  type="button"
                  onClick={() => { onPick(it.url); onOpenChange(false); }}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border hover:border-primary"
                >
                  <img src={it.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
