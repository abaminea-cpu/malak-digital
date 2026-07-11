import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { EditorImagePicker } from "../EditorImagePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SEOContent } from "@/lib/editorDefaults";

export function SEOEditor({ value, onChange }: { value: SEOContent; onChange: (v: SEOContent) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
        Optimisez votre référencement et le rendu lors des partages sur les réseaux sociaux.
      </div>
      <MultiLangInput label="Titre meta (60 car. max)" value={value.metaTitle} onChange={(v) => onChange({ ...value, metaTitle: v })} />
      <MultiLangTextarea label="Description meta (160 car. max)" value={value.metaDescription} onChange={(v) => onChange({ ...value, metaDescription: v })} rows={3} />
      <EditorImagePicker label="Image de partage (Open Graph)" value={value.ogImage} onChange={(url) => onChange({ ...value, ogImage: url })} />
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Mots-clés (séparés par des virgules)</Label>
        <Input value={value.keywords} onChange={(e) => onChange({ ...value, keywords: e.target.value })} placeholder="luxe, algérie, boutique" />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <div>
          <Label>Masquer des moteurs (noindex)</Label>
          <p className="text-xs text-muted-foreground">Empêche l'indexation Google.</p>
        </div>
        <Switch checked={value.noindex} onCheckedChange={(v) => onChange({ ...value, noindex: v })} />
      </div>
    </div>
  );
}
