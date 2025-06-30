// lib/playlist.ts
import type { Song } from '@/types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const monsterTruckSongs: Song[] = [
  { title: "A Monster Truck Christmas - Radio Edit", src: "/audio/A Monster Truck Christmas - Radio Edit.mp3" },
  { title: "Alien Invasion (The Alien Monster Truck)", src: "/audio/Alien Invasion (The Alien Monster Truck).mp3" },
  { title: "All of my Monster Trucks", src: "/audio/All of my Monster Trucks.mp3" },
  { title: "Avenger", src: "/audio/Avenger.mp3" },
  { title: "Bakugan Dragonoid", src: "/audio/Bakugan Dragonoid.mp3" },
  { title: "Blue Thunder (Break Stuff)", src: "/audio/Blue Thunder (Break Stuff).mp3" },
  { title: "Dragon", src: "/audio/Dragon.mp3" },
  { title: "EarthShaker", src: "/audio/EarthShaker.mp3" },
  { title: "El Toro Loco", src: "/audio/El Toro Loco.mp3" },
  { title: "Grave Digger Will Crush You", src: "/audio/Grave Digger Will Crush You.mp3" },
  { title: "I Love Monster Trucks", src: "/audio/I Love Monster Trucks.mp3" },
  { title: "JCB DIGatron", src: "/audio/JCB DIGatron.mp3" },
  { title: "Lucas Stabilizer", src: "/audio/Lucas Stabilizer.mp3" },
  { title: "Max-D (Maximum Destruction)", src: "/audio/Max-D (Maximum Destruction).mp3" },
  { title: "Megalodon", src: "/audio/Megalodon.mp3" },
  { title: "Mohawk Warrior (The Monster Truck with a Mohawk)", src: "/audio/Mohawk Warrior (The Monster Truck with a Mohawk).mp3" },
  { title: "Monster Mutt and Sparkle Smash", src: "/audio/Monster Mutt and Sparkle Smash.mp3" },
  { title: "Monster Mutt", src: "/audio/Monster Mutt.mp3" },
  { title: "Pirate's Curse", src: "/audio/Pirate's Curse.mp3" },
  { title: "Soldier Fortune", src: "/audio/Soldier Fortune.mp3" },
  { title: "Son-uva Digger (Son of Grave Digger)", src: "/audio/Son-uva Digger (Son of Grave Digger).mp3" },
  { title: "Sparkle Smash (The Magic Monster Unicorn Truck)", src: "/audio/Sparkle Smash (The Magic Monster Unicorn Truck).mp3" },
  { title: "ThunderROARus", src: "/audio/ThunderROARus.mp3" },
  { title: "Zombie (Do the Zombie Hands Wave)", src: "/audio/Zombie (Do the Zombie Hands Wave).mp3" },
];

export const shuffledPlaylist = shuffleArray(monsterTruckSongs);
