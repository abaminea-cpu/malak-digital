import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { FAQContent } from "@/lib/editorDefaults";

const uid = () => Math.random().toString(36).slice(2, 10);

export function FAQEditor({ value, onChange }: { value: FAQContent; onChange: (v: FAQContent) => void }) {
  const items = value.items ?? [];
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
              <Button size="icon" variant="ghost" onClick={() => onChange({ ...value, items: items.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <MultiLangInput label="Question" value={it.question} onChange={(v) => onChange({ ...value, items: items.map((x, idx) => idx === i ? { ...x, question: v } : x) })} />
            <MultiLangTextarea label="Réponse" value={it.answer} onChange={(v) => onChange({ ...value, items: items.map((x, idx) => idx === i ? { ...x, answer: v } : x) })} />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...value, items: [...items, { id: uid(), question: { fr: "", en: "" }, answer: { fr: "", en: "" } }] })}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter une question
      </Button>
    </div>
  );
}
