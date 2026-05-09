export interface ReflectionTheme {
  id: string;
  name: string;
  mood: string;
  colors: string[];
  gradient: string;
  image: string;
  levelRequired: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  levelRequired: number;
}

export const REFLECTION_THEMES: ReflectionTheme[] = [
  {
    id: 'dusty_rose',
    name: 'Dusty Rose Premium',
    mood: 'Peaceful',
    colors: ["#C97884", "#D9A5B3", "#F6E6E9", "#A65D67", "#C97884"],
    gradient: '',
    image: '',
    levelRequired: 1,
  },
  {
    id: 'emerald_lake',
    name: 'Emerald Forest',
    mood: 'Reflective',
    colors: ["#0F5132", "#4F7942", "#B08D57", "#0A3621", "#0F5132"],
    gradient: '',
    image: '',
    levelRequired: 2,
  },
  {
    id: 'golden_mocha',
    name: 'Golden Mocha',
    mood: 'Grateful',
    colors: ["#6F4E37", "#A67B5B", "#EAD7C0", "#4A3425", "#6F4E37"],
    gradient: '',
    image: '',
    levelRequired: 3,
  },
  {
    id: 'charcoal_premium',
    name: 'Charcoal Gold',
    mood: 'Deep',
    colors: ["#2C2C2C", "#5E5E5E", "#D4AF37", "#1A1A1A", "#2C2C2C"],
    gradient: '',
    image: '',
    levelRequired: 4,
  },
  {
    id: 'makkah_premium',
    name: 'Sacred Makkah',
    mood: 'Spiritual',
    colors: ["#F5EFE6", "#DCC7AA", "#B89B72", "#EBE3D5", "#F5EFE6"],
    gradient: 'linear-gradient(135deg, #F5EFE6 0%, #DCC7AA 100%)',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=2070',
    levelRequired: 5,
  },
  {
    id: 'madina_premium',
    name: 'Peaceful Madina',
    mood: 'Peace',
    colors: ["#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784", "#E8F5E9"],
    gradient: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    image: 'https://images.unsplash.com/photo-1597405490028-2820d48a3b3e?q=80&w=2070',
    levelRequired: 6,
  }
];

export const BADGES: Badge[] = [
  {
    id: 'level_1_explorer',
    name: 'Knowledge Explorer',
    description: 'Passed Level 1: Foundations of Islam',
    icon: '🌟',
    levelRequired: 1,
  },
  {
    id: 'level_2_seeker',
    name: 'Wisdom Seeker',
    description: 'Passed Level 2: Pillars & Practice',
    icon: '📖',
    levelRequired: 2,
  },
  {
    id: 'level_3_devoted',
    name: 'Devoted Learner',
    description: 'Passed Level 3: Quranic Insights',
    icon: '🕋',
    levelRequired: 3,
  },
  {
    id: 'level_4_scholar',
    name: 'Aspiring Scholar',
    description: 'Passed Level 4: Hadith & Sunnah',
    icon: '📜',
    levelRequired: 4,
  },
  {
    id: 'level_5_guardian',
    name: 'Faith Guardian',
    description: 'Passed Level 5: History & Legacy',
    icon: '🛡️',
    levelRequired: 5,
  },
  {
    id: 'mushkil_master',
    name: 'Mushkil Master',
    description: 'Mastered the most difficult challenge in the sanctuary.',
    icon: '🔥',
    levelRequired: 6,
  },
];
