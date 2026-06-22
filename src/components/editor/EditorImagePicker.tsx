import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { Image as ImageIcon, X } from "lucide-react";

export function EditorImagePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(null)} className="absolute right-0 top-0 rounded-bl bg-background/80 p-1 text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Choisir une image
        </Button>
      </div>
      <MediaLibrary open={open} onOpenChange={setOpen} onPick={onChange} />
    </div>
  );
}
