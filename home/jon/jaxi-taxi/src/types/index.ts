export interface Song {
  title: string;
  artist: string;
  src: string;
}

export type LightingEffect = string;

export interface LightingConfig {
  color: string;
  intensity: number;
  effect: LightingEffect;
}

export interface Settings {
  volume: number;
  defaultEffect: LightingEffect;
  uiScale: number;
}
