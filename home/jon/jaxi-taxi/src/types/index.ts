export interface Song {
  title: string;
  artist: string;
  src: string;
}

// This needs to be a generic string to allow for any effect name from the AI.
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
