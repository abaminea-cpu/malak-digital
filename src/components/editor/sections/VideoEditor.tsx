import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import { EditorImagePicker } from "../EditorImagePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { VideoContent } from "@/lib/editorDefaults";

export function VideoEditor({ value, onChange }: { value: VideoContent; onChange: (v: VideoContent) => void }) {
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <MultiLangTextarea label="Sous-titre" value={value.subtitle} onChange={(v) => onChange({ ...value, subtitle: v })} rows={2} />
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">URL de la vidéo (MP4, YouTube, Vimeo)</Label>
        <Input value={value.videoUrl} onChange={(e) => onChange({ ...value, videoUrl: e.target.value })} placeholder="https://..." />
      </div>
      <EditorImagePicker label="Image d'aperçu (poster)" value={value.poster} onChange={(url) => onChange({ ...value, poster: url })} />
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>Lecture automatique</Label>
        <Switch checked={value.autoplay} onCheckedChange={(v) => onChange({ ...value, autoplay: v })} />
      </div>
    </div>
  );
}
