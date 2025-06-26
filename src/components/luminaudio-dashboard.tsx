"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Song, LightingConfig, Settings, LightingEffect } from '@/types';
import { audioAnalysisLighting } from '@/ai/flows/audio-analysis-flow';
import { AudioPlayer } from '@/components/audio-player';
import { LightingVisualizer } from '@/components/lighting-visualizer';
import { SettingsPanel } from '@/components/settings-panel';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Music4 } from 'lucide-react';

interface LuminaudioDashboardProps {
  playlist: Song[];
}

export function LuminaudioDashboard({ playlist }: LuminaudioDashboardProps) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [lightingConfig, setLightingConfig] = useState<LightingConfig>({
    color: '#673AB7',
    intensity: 0.7,
    effect: 'pulse',
  });
  const [settings, setSettings] = useState<Settings>({
    volume: 0.5,
    defaultEffect: 'pulse',
  });
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(true);
  const { toast } = useToast();

  const handleAiAnalysis = useCallback(async (song: Song) => {
    setIsAiAnalyzing(true);
    try {
      const response = await fetch(song.src);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const audioDataUri = reader.result as string;
        const result = await audioAnalysisLighting({
          audioDataUri,
          currentSettings: JSON.stringify({ defaultEffect: settings.defaultEffect }),
        });
        setLightingConfig({
            ...result,
            effect: result.effect.toLowerCase() as LightingEffect
        });
        setIsAiAnalyzing(false);
      };
    } catch (error) {
      console.error('Error during AI analysis:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: 'Could not analyze song. Using default lighting.',
      });
      setLightingConfig({
        color: '#AEEA00',
        intensity: 0.8,
        effect: settings.defaultEffect,
      });
      setIsAiAnalyzing(false);
    }
  }, [settings.defaultEffect, toast]);

  useEffect(() => {
    if (playlist.length > 0) {
        handleAiAnalysis(playlist[currentSongIndex]);
    } else {
        setIsAiAnalyzing(false);
    }
  }, [currentSongIndex, playlist, handleAiAnalysis]);
  
  const handleNextSong = useCallback(() => {
    if (playlist.length > 0) {
        setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }
  }, [playlist.length]);

  const handlePrevSong = () => {
    if (playlist.length > 0) {
        setCurrentSongIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
    }
  };
  
  if (playlist.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
          <Card className="max-w-lg text-center bg-card/80 backdrop-blur-lg">
              <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                      <Music4 className="w-8 h-8 text-accent" />
                      No Music Found
                  </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                  <p>To get started, copy your MP3 files into the project's <code>public/audio</code> directory.</p>
                  <p className="text-sm text-muted-foreground">
                      Once you've added songs, just refresh this page.
                  </p>
              </CardContent>
          </Card>
      </div>
    );
  }

  const currentSong = playlist[currentSongIndex];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl font-headline">
          Jaxi Taxi
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your personal audio-visual experience
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div className="lg:col-span-1">
          <AudioPlayer
            song={currentSong}
            volume={settings.volume}
            onVolumeChange={(v) => setSettings(s => ({...s, volume: v}))}
            onNext={handleNextSong}
            onPrev={handlePrevSong}
            onEnded={handleNextSong}
          />
        </div>
        <div className="lg:col-span-1 flex items-center justify-center">
        {isAiAnalyzing ? (
            <div className="w-full h-64 md:h-80 lg:h-full flex flex-col items-center justify-center gap-4 bg-card rounded-lg p-4">
                <Skeleton className="h-3/4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2" />
                <p className="text-muted-foreground animate-pulse">AI is analyzing audio...</p>
            </div>
        ) : (
            <LightingVisualizer config={lightingConfig} />
        )}
        </div>
        <div className="lg:col-span-1">
          <SettingsPanel settings={settings} onSettingsChange={setSettings} />
        </div>
      </div>
    </div>
  );
}
