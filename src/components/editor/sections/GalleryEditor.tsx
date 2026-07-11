import { MultiLangInput } from "../MultiLangInput";
import { EditorImagePicker } from "../EditorImagePicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { GalleryContent } from "@/lib/editorDefaults";

const uid = () => Math.random().toString(36).slice(2, 10);

export function GalleryEditor({ value, onChange }: { value: GalleryContent; onChange: (v: GalleryContent) => void }) {
  const images = value.images ?? [];
  function update(i: number, patch: Partial<GalleryContent["images"][number]>) {
    onChange({ ...value, images: images.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...value, images: next });
  }
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Colonnes</Label>
        <Select value={String(value.columns ?? 3)} onValueChange={(v) => onChange({ ...value, columns: Number(v) })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} colonnes</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {images.map((img, i) => (
          <div key={img.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Image {i + 1}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === images.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onChange({ ...value, images: images.filter((_, idx) => idx !== i) })}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
            <EditorImagePicker label="Image" value={img.url} onChange={(url) => update(i, { url: url ?? "" })} />
            <MultiLangInput label="Légende" value={img.caption} onChange={(v) => update(i, { caption: v })} />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...value, images: [...images, { id: uid(), url: "", caption: { fr: "", en: "" } }] })}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter une image
      </Button>
    </div>
  );
}
