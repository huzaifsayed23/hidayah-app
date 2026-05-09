/**
 * HIDAYAH ULTIMATE GRADIENT SUITE
 * A structured library of spiritually-themed background gradients.
 */

export interface GradientOption {
  id: string;
  name: string;
  colors: string[]; // 4 colors for marble/mesh effect
  primary: string;  // Primary representative color
}

export interface GradientTheme {
  id: string;
  label: string;
  description: string;
  options: GradientOption[];
}

export const GRADIENT_LIBRARY: Record<string, GradientTheme> = {
  Kawn: {
    id: "Kawn",
    label: "Kawn",
    description: "Signs of Creation",
    options: [
      { id: "nature-1", name: "Emerald & Gold Steel", colors: ["#064E3B", "#C9A646", "#334155", "#022C22"], primary: "#064E3B" },
      { id: "nature-2", name: "Forest Aura & Silver", colors: ["#065F46", "#BDC3C7", "#1E293B", "#14532D"], primary: "#065F46" },
      { id: "nature-3", name: "Deep Ivy & Bronze", colors: ["#064E3B", "#8C6239", "#0F172A", "#065F46"], primary: "#064E3B" },
      { id: "nature-4", name: "Moss & Sky Swirl", colors: ["#14532D", "#0EA5E9", "#064E3B", "#475569"], primary: "#14532D" },
      { id: "nature-5", name: "Jade & Ruby Glow", colors: ["#0D9488", "#E0115F", "#334155", "#064E3B"], primary: "#0D9488" },
    ]
  },
  Grateful: {
    id: "Grateful",
    label: "Grateful",
    description: "Royal Teal & Bronze Marble",
    options: [
      { id: "grateful-1", name: "Teal & Amber Swirl", colors: ["#134E4A", "#FBBF24", "#1E293B", "#115E59"], primary: "#134E4A" },
      { id: "grateful-2", name: "Gilded Turquoise", colors: ["#0F766E", "#C9A646", "#0D9488", "#022C22"], primary: "#0F766E" },
      { id: "grateful-3", name: "Midnight Emerald & Rose", colors: ["#059669", "#B76E79", "#134E4A", "#064E3B"], primary: "#059669" },
      { id: "grateful-4", name: "Bronze Teal Flow", colors: ["#B45309", "#134E4A", "#78350F", "#0F766E"], primary: "#B45309" },
      { id: "grateful-5", name: "Deep Sea & Gold Metallic", colors: ["#115E59", "#C9A646", "#0D9488", "#334155"], primary: "#115E59" },
    ]
  },
  Hopeful: {
    id: "Hopeful",
    label: "Hopeful",
    description: "Sky Rainbow Marble",
    options: [
      { id: "hopeful-1", name: "Electric Sky & Silver", colors: ["#00BFFF", "#0284C7", "#0EA5E9", "#71717A"], primary: "#00BFFF" },
      { id: "hopeful-2", name: "Cyan Dream Swirl", colors: ["#00FFFF", "#06B6D4", "#0891B2", "#FF69B4"], primary: "#00FFFF" },
      { id: "hopeful-3", name: "Pink Cloud & Cyan", colors: ["#38BDF8", "#FF69B4", "#DB2777", "#00FFFF"], primary: "#38BDF8" },
      { id: "hopeful-4", name: "Aurora Rainbow Glow", colors: ["#22D3EE", "#4F46E5", "#22C55E", "#D946EF"], primary: "#22D3EE" },
      { id: "hopeful-5", name: "Crystal Rainbow Rain", colors: ["#F472B6", "#818CF8", "#34D399", "#22D3EE"], primary: "#F472B6" },
    ]
  },
  Reflective: {
    id: "Reflective",
    label: "Reflective",
    description: "Cosmic Lavender Marble",
    options: [
      { id: "reflective-1", name: "Deep Violet Swirl", colors: ["#8B5CF6", "#7C3AED", "#6D28D9", "#FF1493"], primary: "#8B5CF6" },
      { id: "reflective-2", name: "Indigo Rainbow Flow", colors: ["#6366F1", "#4F46E5", "#4338CA", "#06B6D4"], primary: "#6366F1" },
      { id: "reflective-3", name: "Neon Magenta & Cyan", colors: ["#D946EF", "#C026D3", "#A21CAF", "#00FFFF"], primary: "#D946EF" },
      { id: "reflective-4", name: "Starlit Plum & Gold", colors: ["#A855F7", "#D4AF37", "#9333EA", "#7E22CE"], primary: "#A855F7" },
      { id: "reflective-5", name: "Cosmic Rainbow Glow", colors: ["#1E3A8A", "#1E40AF", "#D946EF", "#06B6D4"], primary: "#1E3A8A" },
    ]
  },
  Sabr: {
    id: "Sabr",
    label: "Sabr",
    description: "Elegant Iridescent Marble",
    options: [
      { id: "sabr-1", name: "Lavender Gold Swirl", colors: ["#818CF8", "#D4AF37", "#6366F1", "#DB2777"], primary: "#818CF8" },
      { id: "sabr-2", name: "Iridescent Rainbow", colors: ["#71717A", "#D946EF", "#06B6D4", "#4B5563"], primary: "#71717A" },
      { id: "sabr-3", name: "Golden Silk & Peach", colors: ["#D4AF37", "#6366F1", "#B45309", "#EA580C"], primary: "#D4AF37" },
      { id: "sabr-4", name: "Rainbow Quartz Marble", colors: ["#F472B6", "#22D3EE", "#FBBF24", "#8B5CF6"], primary: "#F472B6" },
      { id: "sabr-5", name: "Royal Silver & Gold", colors: ["#9CA3AF", "#B8860B", "#B45309", "#4B5563"], primary: "#B8860B" },
    ]
  },
  Premium: {
    id: "Premium",
    label: "Premium",
    description: "Ultra-High Fidelity Metallic Suites",
    options: [
      { id: "premium-1", name: "Royal Gold", colors: ["#C9A646", "#F5E6B3", "#A67C00", "#451A03"], primary: "#C9A646" },
      { id: "premium-2", name: "Liquid Silver", colors: ["#BDC3C7", "#ECECEC", "#8E9EAB", "#2C3E50"], primary: "#BDC3C7" },
      { id: "premium-3", name: "Emerald Metal", colors: ["#0F3D2E", "#1F7A63", "#A8E6CF", "#052018"], primary: "#1F7A63" },
      { id: "premium-4", name: "Sapphire Blue Steel", colors: ["#1E3C72", "#2A5298", "#AFCBFF", "#0B132B"], primary: "#2A5298" },
      { id: "premium-5", name: "Rose Gold Luxe", colors: ["#B76E79", "#FFD1DC", "#E6A4B4", "#78350F"], primary: "#B76E79" },
      { id: "premium-6", name: "Bronze Glow", colors: ["#8C6239", "#CD7F32", "#F4A460", "#3D2B1F"], primary: "#CD7F32" },
      { id: "premium-7", name: "Obsidian Black Shine", colors: ["#0F0F0F", "#434343", "#1C1C1C", "#020617"], primary: "#434343" },
      { id: "premium-8", name: "Titanium Dusk", colors: ["#374151", "#4B5563", "#1F2937", "#111827"], primary: "#4B5563" },
      { id: "premium-9", name: "Amethyst Metal", colors: ["#5F0A87", "#A4508B", "#FBC2EB", "#31013E"], primary: "#A4508B" },
      { id: "premium-10", name: "Sunset Copper", colors: ["#B87333", "#FF8C42", "#FFD194", "#7C2D12"], primary: "#FF8C42" },
      { id: "premium-11", name: "Imperial Maroon", colors: ["#4A0404", "#800000", "#E5E4E2", "#C0C0C0"], primary: "#800000" },
    ]
  }
};










export const SPIRITUAL_THEMES = Object.keys(GRADIENT_LIBRARY).filter(key => key !== 'Premium');

// --- BACKWARD COMPATIBILITY (LEGACY PALETTES UPDATED TO MARBLE) ---
export const PALETTES: Record<string, string[]> = {
  "Kawn": ["#064E3B", "#065F46", "#14532D", "#022C22", "#0F172A"],
  "Grateful": ["#134E4A", "#0D9488", "#1E293B", "#115E59", "#111827"],
  "Hopeful": ["#00BFFF", "#0284C7", "#0EA5E9", "#00FFFF", "#0C4A6E"],
  "Reflective": ["#8B5CF6", "#7C3AED", "#6D28D9", "#FF69B4", "#4C1D95"],
  "Sabr": ["#818CF8", "#D4AF37", "#6366F1", "#DB2777", "#312E81"],
  "Seeking Sabr": ["#818CF8", "#D4AF37", "#6366F1", "#DB2777", "#312E81"], // Alias for Sabr
  "Peaceful": ["#34D399", "#BEF264", "#10B981", "#059669", "#064E3B"],
  "Burgundy Royal": ["#D946EF", "#C026D3", "#A21CAF", "#00FFFF", "#701A75"],
  "Mocha Cream": ["#FBBF24", "#F59E0B", "#D97706", "#FFD700", "#451A03"],
  "Olive Sage": ["#065F46", "#34D399", "#059669", "#047857", "#022C22"],
  "Charcoal Gold": ["#4B5563", "#D4AF37", "#1F2937", "#B45309", "#111827"],
  "Premium": ["#C9A646", "#F5E6B3", "#A67C00", "#451A03", "#000000"],
};

export const MOOD_PALETTES = PALETTES;

export const generateMeshGradient = (colors: string[], variant: number) => {
  if (!colors || colors.length < 4) return '';
  
  // High-fidelity 'Combo' engine - sharp, clean, and vibrant
  const configs = [
    [
      `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 40%, ${colors[2]} 70%, ${colors[3]} 100%)`,
      `radial-gradient(circle at 10% 10%, ${colors[0]} 0%, transparent 50%)`,
      `radial-gradient(circle at 90% 90%, ${colors[2]} 0%, transparent 50%)`,
    ],
    [
      `linear-gradient(225deg, ${colors[1]} 0%, ${colors[2]} 50%, ${colors[0]} 100%)`,
      `radial-gradient(circle at 50% 0%, ${colors[1]} 0%, transparent 70%)`,
      `radial-gradient(circle at 50% 100%, ${colors[3]} 0%, transparent 70%)`,
    ]
  ];
  const selectedConfig = configs[variant % configs.length];
  return selectedConfig ? selectedConfig.join(', ') : '';
};
