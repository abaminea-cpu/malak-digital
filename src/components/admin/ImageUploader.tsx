import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";

export function ImageUploader({
  bucket,
  value,
  onChange,
  max = 8,
}: {
  bucket: "product-images" | "blog-images";
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const remaining = Math.max(0, max - value.length);
      const list = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(list.map((f) => uploadImage(bucket, f)));
      onChange([...value, ...urls]);
      toast.success(`${urls.length} image(s) téléversée(s)`);
    } catch (e: any) {
      toast.error(e.message ?? "Échec téléversement");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-0 top-0 rounded-bl bg-background/80 p-1 text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:text-gold hover:border-gold/50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">{value.length}/{max} images</p>
    </div>
  );
}

export function SingleImageUploader({
  bucket,
  value,
  onChange,
}: {
  bucket: "product-images" | "blog-images";
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  return (
    <ImageUploader
      bucket={bucket}
      value={value ? [value] : []}
      onChange={(urls) => onChange(urls[0] ?? null)}
      max={1}
    />
  );
}
