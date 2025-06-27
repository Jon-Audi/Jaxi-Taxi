"use client";

import type { FC } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';
import type { Settings, LightingEffect } from '@/types';
import { Slider } from './ui/slider';

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
    <Card className="border-white/20 bg-card/80 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="text-accent" />
          <span>Settings</span>
        </CardTitle>
        <CardDescription>
          Configure your audio and lighting preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
              <SelectItem value="pulse">Pulse</SelectItem>
              <SelectItem value="strobe">Strobe</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
};
