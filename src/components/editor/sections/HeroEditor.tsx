import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { EditorImagePicker } from "../EditorImagePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HeroContent } from "@/lib/editorDefaults";

export function HeroEditor({ value, onChange }: { value: HeroContent; onChange: (v: HeroContent) => void }) {
  return (
    <div className="space-y-4">
      <MultiLangInput label="Tagline" value={value.tagline} onChange={(v) => onChange({ ...value, tagline: v })} />
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <MultiLangTextarea label="Sous-titre" value={value.subtitle} onChange={(v) => onChange({ ...value, subtitle: v })} />
      <MultiLangInput label="Texte CTA" value={value.ctaText} onChange={(v) => onChange({ ...value, ctaText: v })} />
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Lien CTA</Label>
        <Input value={value.ctaLink ?? ""} onChange={(e) => onChange({ ...value, ctaLink: e.target.value })} placeholder="/shop" />
      </div>
      <EditorImagePicker label="Image de fond" value={value.image} onChange={(url) => onChange({ ...value, image: url })} />
    </div>
  );
}
