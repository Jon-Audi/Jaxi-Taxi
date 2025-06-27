"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { Song } from '@/types';

interface AudioPlayerProps {
  song: Song;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onEnded: () => void;
}

export const AudioPlayer: FC<AudioPlayerProps> = ({ song, volume, onVolumeChange, onNext, onPrev, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
      };
      const setAudioTime = () => {
        setProgress(audio.currentTime);
      };

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', onEnded);
      audio.volume = volume;

      if (isPlaying) {
        audio.play().catch(e => console.error("Autoplay failed", e));
      } else {
        audio.pause();
      }

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [isPlaying, volume, onEnded]);
  
  useEffect(() => {
    // When song changes, reset but DON'T play automatically on initial load.
    // If a song was already playing, continue playing the new one.
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      if (isPlaying) {
        // This ensures subsequent songs in the playlist auto-play
        audioRef.current.play().catch(e => {
            console.error("Autoplay for next song failed", e);
            // If autoplay fails here, we should probably stop trying.
            setIsPlaying(false);
        });
      }
    }
  }, [song]);


  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressChange = (value: number[]) => {
      if(audioRef.current) {
        audioRef.current.currentTime = value[0];
        setProgress(value[0]);
      }
  }

  return (
    <Card className="border-white/20 bg-card/80 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Music className="text-accent" />
            <span>Now Playing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
            <p className="text-lg font-semibold truncate">{song.title}</p>
            <p className="text-sm text-muted-foreground">{song.artist}</p>
        </div>

        <audio ref={audioRef} src={song.src} preload="auto" />

        <div className="space-y-2">
            <Slider
                value={[progress]}
                max={duration}
                step={1}
                onValueChange={handleProgressChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={onPrev}>
            <SkipBack className="w-6 h-6" />
          </Button>
          <Button variant="default" size="icon" className="w-16 h-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext}>
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
            {volume > 0 ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
            <Slider 
                defaultValue={[0.5]}
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => onVolumeChange(value[0])}
            />
        </div>
      </CardContent>
    </Card>
  );
};
