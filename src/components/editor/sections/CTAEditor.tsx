import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CTAContent } from "@/lib/editorDefaults";

export function CTAEditor({ value, onChange }: { value: CTAContent; onChange: (v: CTAContent) => void }) {
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <MultiLangTextarea label="Sous-titre" value={value.subtitle} onChange={(v) => onChange({ ...value, subtitle: v })} rows={2} />
      <MultiLangInput label="Texte du bouton" value={value.ctaText} onChange={(v) => onChange({ ...value, ctaText: v })} />
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Lien du bouton</Label>
        <Input value={value.ctaLink ?? ""} onChange={(e) => onChange({ ...value, ctaLink: e.target.value })} />
      </div>
    </div>
  );
}
