import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { EditorImagePicker } from "../EditorImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { ProgrammesContent } from "@/lib/editorDefaults";

const uid = () => Math.random().toString(36).slice(2, 10);

export function ProgrammesEditor({ value, onChange }: { value: ProgrammesContent; onChange: (v: ProgrammesContent) => void }) {
  const cards = value.cards ?? [];
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <div className="space-y-3">
        {cards.map((c, i) => (
          <div key={c.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Carte {i + 1}</span>
              <Button size="icon" variant="ghost" onClick={() => onChange({ ...value, cards: cards.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <MultiLangInput label="Titre" value={c.title} onChange={(v) => onChange({ ...value, cards: cards.map((x, idx) => idx === i ? { ...x, title: v } : x) })} />
            <MultiLangTextarea label="Description" value={c.description} onChange={(v) => onChange({ ...value, cards: cards.map((x, idx) => idx === i ? { ...x, description: v } : x) })} />
            <EditorImagePicker label="Image" value={c.image} onChange={(url) => onChange({ ...value, cards: cards.map((x, idx) => idx === i ? { ...x, image: url } : x) })} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lien</Label>
              <Input value={c.link ?? ""} onChange={(e) => onChange({ ...value, cards: cards.map((x, idx) => idx === i ? { ...x, link: e.target.value } : x) })} />
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...value, cards: [...cards, { id: uid(), title: { fr: "", en: "" }, description: { fr: "", en: "" }, image: null, link: "" }] })}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter une carte
      </Button>
    </div>
  );
}
