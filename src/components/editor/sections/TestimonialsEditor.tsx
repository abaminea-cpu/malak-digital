import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { EditorImagePicker } from "../EditorImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";
import type { TestimonialsContent } from "@/lib/editorDefaults";

const uid = () => Math.random().toString(36).slice(2, 10);

export function TestimonialsEditor({ value, onChange }: { value: TestimonialsContent; onChange: (v: TestimonialsContent) => void }) {
  const items = value.items ?? [];
  function update(i: number, patch: Partial<TestimonialsContent["items"][number]>) {
    onChange({ ...value, items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...value, items: next });
  }
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre de section" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Témoignage {i + 1}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onChange({ ...value, items: items.filter((_, idx) => idx !== i) })}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Auteur</Label>
                <Input value={it.author} onChange={(e) => update(i, { author: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Rôle / Ville</Label>
                <Input value={it.role} onChange={(e) => update(i, { role: e.target.value })} />
              </div>
            </div>
            <EditorImagePicker label="Avatar" value={it.avatar} onChange={(url) => update(i, { avatar: url })} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Note (1-5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => update(i, { rating: n })} type="button">
                    <Star className={`h-4 w-4 ${n <= it.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <MultiLangTextarea label="Citation" value={it.quote} onChange={(v) => update(i, { quote: v })} rows={2} />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...value, items: [...items, { id: uid(), author: "", role: "", avatar: null, rating: 5, quote: { fr: "", en: "" } }] })}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter un témoignage
      </Button>
    </div>
  );
}
