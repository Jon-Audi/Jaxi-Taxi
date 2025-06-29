"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LightingConfig, LightingEffect } from '@/types';
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

  /**
   * Maps new WLED effect names to existing CSS classes for the visualizer
   * to prevent the UI from breaking if a direct CSS animation isn't available.
   */
  const getEffectClass = (effectName: LightingEffect): string => {
    switch (effectName) {
      case 'bpm':
      case 'chase':
      case 'fireworks':
        return 'effect-pulse';
      case 'solid':
        return 'effect-static';
      // Effects like 'strobe', 'pulse', 'fade', 'static' already have direct CSS classes.
      default:
        return `effect-${effectName}`;
    }
  };

  return (
    <Card className="w-full h-64 md:h-80 lg:h-full flex flex-col justify-between overflow-hidden border-white/20 bg-card/80 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="text-accent" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center p-0">
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className={cn(
              "relative w-48 h-48 rounded-full",
              getEffectClass(effect)
            )}
            style={visualizerStyle}
          />
        </div>
      </CardContent>
    </Card>
  );
};
