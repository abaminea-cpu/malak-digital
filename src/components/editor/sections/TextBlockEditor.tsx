import { MultiLangInput } from "../MultiLangInput";
import { MultiLangTextarea } from "../MultiLangTextarea";
import type { TextBlockContent } from "@/lib/editorDefaults";

export function TextBlockEditor({ value, onChange }: { value: TextBlockContent; onChange: (v: TextBlockContent) => void }) {
  return (
    <div className="space-y-4">
      <MultiLangInput label="Titre" value={value.title} onChange={(v) => onChange({ ...value, title: v })} />
      <MultiLangTextarea label="Contenu" value={value.body} onChange={(v) => onChange({ ...value, body: v })} rows={8} />
    </div>
  );
}
