export type MusicSample = {
  id: string;
  filename: string;
  sourceUrl: string;
  category: 'Chill' | 'Epic' | 'Happy' | 'Energy' | 'Cinematic';
  duration: number; // seconds
};

export const MUSIC_SAMPLES: MusicSample[] = [
  {
    id: 'sample-chill-1',
    filename: 'Chill Lofi Study.mp3',
    sourceUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808f3099c.mp3',
    category: 'Chill',
    duration: 145,
  },
  {
    id: 'sample-epic-1',
    filename: 'Epic Heroic Cinematic.mp3',
    sourceUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73456.mp3',
    category: 'Epic',
    duration: 184,
  },
  {
    id: 'sample-happy-1',
    filename: 'Upbeat Happy Corporate.mp3',
    sourceUrl: 'https://cdn.pixabay.com/audio/2022/01/21/audio_31b4369766.mp3',
    category: 'Happy',
    duration: 128,
  },
  {
    id: 'sample-energy-1',
    filename: 'Dynamic Synthwave.mp3',
    sourceUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_73e7c8a41c.mp3',
    category: 'Energy',
    duration: 160,
  },
  {
    id: 'sample-cinematic-1',
    filename: 'Ethereal Ambient.mp3',
    sourceUrl: 'https://cdn.pixabay.com/audio/2021/11/25/audio_91b7d7b056.mp3',
    category: 'Cinematic',
    duration: 210,
  }
];
