
"use client";

import type { FC } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Settings, LightingEffect } from '@/types';
import { Slider } from '@/components/ui/slider';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export const SettingsPanel: FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const handleEffectChange = (value: LightingEffect) => {
    onSettingsChange({ ...settings, defaultEffect: value });
  };

  const handleScaleChange = (value: number[]) => {
    onSettingsChange({ ...settings, uiScale: value[0] });
  };

  return (
    <div className="grid gap-y-6">
      <div className="grid gap-y-1.5">
        <h3 className="font-semibold leading-none tracking-tight">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your audio and lighting preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default-effect">Default Lighting Effect</Label>
          <Select
            value={settings.defaultEffect}
            onValueChange={handleEffectChange}
          >
            <SelectTrigger id="default-effect">
              <SelectValue placeholder="Select an effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="bpm">BPM</SelectItem>
              <SelectItem value="fireworks">Fireworks</SelectItem>
              <SelectItem value="meteor">Meteor</SelectItem>
              <SelectItem value="lightning">Lightning</SelectItem>
              <SelectItem value="rainbow">Rainbow</SelectItem>
              <SelectItem value="chase random">Chase Random</SelectItem>
              <SelectItem value="fire flicker">Fire Flicker</SelectItem>
              <SelectItem value="ripple">Ripple</SelectItem>
              <SelectItem value="scan">Scan</SelectItem>
              <SelectItem value="strobe">Strobe</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Fallback effect if AI analysis fails.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ui-scale">UI Scale</Label>
          <Slider
            id="ui-scale"
            min={0.8}
            max={1.2}
            step={0.05}
            value={[settings.uiScale]}
            onValueChange={handleScaleChange}
          />
          <p className="text-xs text-muted-foreground">
            Adjust the size of the dashboard components.
          </p>
        </div>

        <div className="space-y-2">
            <Label>GPIO Pin Configuration</Label>
            <div className="p-4 rounded-md bg-muted/50 border border-dashed">
                <p className="text-sm text-muted-foreground">
                    GPIO control settings would be configured here. This is a placeholder as direct hardware access from the web UI is not possible.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
