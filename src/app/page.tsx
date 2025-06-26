import Image from 'next/image';
import { LuminaudioDashboard } from '@/components/luminaudio-dashboard';

export default function Home() {
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
      <LuminaudioDashboard />
    </main>
  );
}
