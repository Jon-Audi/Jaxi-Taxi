"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LightingConfig } from '@/types';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface LightingVisualizerProps {
  config: LightingConfig;
}

export const LightingVisualizer: FC<LightingVisualizerProps> = ({ config }) => {
  const { color, intensity, effect } = config;

  const visualizerStyle = {
    backgroundColor: color,
    boxShadow: `0 0 70px 20px ${color}`,
    opacity: intensity,
  };

  return (
    <Card className="w-full h-64 md:h-80 lg:h-full flex flex-col justify-between overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-accent" />
          <span>Lighting Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center p-0">
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className={cn(
              "relative w-48 h-48 rounded-full",
              `effect-${effect}`
            )}
            style={visualizerStyle}
          />
        </div>
      </CardContent>
    </Card>
  );
};
