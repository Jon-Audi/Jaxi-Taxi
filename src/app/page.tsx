import fs from 'fs';
import path from 'path';
import { LuminaudioDashboard } from '@/components/luminaudio-dashboard';
import type { Song } from '@/types';

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function Home() {
  const audioDir = path.join(process.cwd(), 'public/audio');
  let playlist: Song[] = [];

  try {
    // Ensure the directory exists so the app doesn't crash on first run
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const files = fs.readdirSync(audioDir);
    const createdPlaylist = files
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
      
    // Shuffle the playlist before sending it to the client
    playlist = shuffle(createdPlaylist);

  } catch (error) {
    console.error("Could not read audio directory:", error);
    // If there's an error, playlist remains empty, and the UI will show a message.
  }

  return (
    <main className="relative min-h-screen w-full font-body">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed h-full w-full object-cover -z-10"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-none" />
      <LuminaudioDashboard playlist={playlist} />
    </main>
  );
}
