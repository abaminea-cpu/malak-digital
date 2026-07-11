import { MultiLangInput } from "../MultiLangInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BannerContent } from "@/lib/editorDefaults";

export function BannerEditor({ value, onChange }: { value: BannerContent; onChange: (v: BannerContent) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>Bannière activée</Label>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
      </div>
      <MultiLangInput label="Message" value={value.message} onChange={(v) => onChange({ ...value, message: v })} />
      <MultiLangInput label="Texte du bouton" value={value.ctaText} onChange={(v) => onChange({ ...value, ctaText: v })} />
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Lien</Label>
        <Input value={value.ctaLink ?? ""} onChange={(e) => onChange({ ...value, ctaLink: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Couleur fond</Label>
          <Input type="color" value={value.bgColor} onChange={(e) => onChange({ ...value, bgColor: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Couleur texte</Label>
          <Input type="color" value={value.textColor} onChange={(e) => onChange({ ...value, textColor: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
