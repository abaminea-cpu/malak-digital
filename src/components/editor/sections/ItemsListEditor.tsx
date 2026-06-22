import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { EditorImagePicker } from "../EditorImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { ItemsListContent } from "@/lib/editorDefaults";

const uid = () => Math.random().toString(36).slice(2, 10);

export function ItemsListEditor({ value, onChange }: { value: ItemsListContent; onChange: (v: ItemsListContent) => void }) {
  const items = value.items ?? [];
  function update(i: number, patch: Partial<ItemsListContent["items"][number]>) {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange({ ...value, items: next });
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
              <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onChange({ ...value, items: items.filter((_, idx) => idx !== i) })}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
            <MultiLangInput label="Titre" value={it.title} onChange={(v) => update(i, { title: v })} />
            <MultiLangTextarea label="Description" value={it.description} onChange={(v) => update(i, { description: v })} rows={2} />
            <EditorImagePicker label="Image" value={it.image} onChange={(url) => update(i, { image: url })} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lien</Label>
              <Input value={it.link ?? ""} onChange={(e) => update(i, { link: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...value, items: [...items, { id: uid(), title: { fr: "", en: "" }, description: { fr: "", en: "" }, image: null, link: "" }] })}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter un item
      </Button>
    </div>
  );
}
