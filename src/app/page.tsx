import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import { LuminaudioDashboard } from '@/components/luminaudio-dashboard';
import type { Song } from '@/types';

export default function Home() {
  const audioDir = path.join(process.cwd(), 'public/audio');
  let playlist: Song[] = [];

  try {
    // Ensure the directory exists so the app doesn't crash on first run
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const files = fs.readdirSync(audioDir);
    playlist = files
      .filter((file) => file.endsWith('.mp3'))
      .map((file) => {
        // Create a cleaner title from the filename
        const title = path
          .basename(file, '.mp3')
          .replace(/[-_]/g, ' ') // Replace underscores/hyphens with spaces
          .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize words
        return {
          title: title,
          artist: 'Unknown Artist',
          src: `/audio/${file}`,
        };
      });
  } catch (error) {
    console.error("Could not read audio directory:", error);
    // If there's an error, playlist remains empty, and the UI will show a message.
  }

  return (
    <main className="relative min-h-screen w-full font-body">
      <div className="fixed h-full w-full -z-10">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Animated background"
          data-ai-hint="abstract particles"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>
      <LuminaudioDashboard playlist={playlist} />
    </main>
  );
}
