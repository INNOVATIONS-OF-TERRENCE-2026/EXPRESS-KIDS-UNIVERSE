import { useState, useEffect } from "react";
import { Shield, Volume2, VolumeX, Eye, EyeOff, Save as SaveIcon, Baby } from "lucide-react";
import { AuroraGradient, CinematicButton, EmptyState } from "@/components/eku";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getParentSettings, saveParentSettings, ParentSettings } from "@/lib/storage";
import { toast } from "sonner";

export default function ParentControls() {
  const [settings, setSettings] = useState<ParentSettings>(getParentSettings());

  useEffect(() => {
    saveParentSettings(settings);
  }, [settings]);

  const update = (key: keyof ParentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success("Settings saved");
  };

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold aurora-text mb-2">Parent Controls</h1>
            <p className="text-muted-foreground">Customize your child's experience</p>
          </div>

          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <Label className="text-base font-semibold">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">Enable audio feedback</p>
                </div>
              </div>
              <Switch checked={settings.soundEnabled} onCheckedChange={v => update("soundEnabled", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.reducedMotion ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-primary" />}
                <div>
                  <Label className="text-base font-semibold">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations</p>
                </div>
              </div>
              <Switch checked={settings.reducedMotion} onCheckedChange={v => update("reducedMotion", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SaveIcon className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-base font-semibold">Allow Saving</Label>
                  <p className="text-sm text-muted-foreground">Save adventures to gallery</p>
                </div>
              </div>
              <Switch checked={settings.allowSaving} onCheckedChange={v => update("allowSaving", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Baby className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-base font-semibold">Content Filter</Label>
                  <p className="text-sm text-muted-foreground">Story content level</p>
                </div>
              </div>
              <Select value={settings.contentFilter} onValueChange={v => update("contentFilter", v as "gentle" | "standard")}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">Gentle</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}