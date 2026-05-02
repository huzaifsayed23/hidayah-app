export const PALETTES: Record<string, string[]> = {
  // Original Moods
  "Peaceful": ["#00FF87", "#60EFFF", "#00C9FF", "#38EF7D", "#0A1128"],
  "Grateful": ["#FF0080", "#7928CA", "#00B4D8", "#FFD700", "#1A0B2E"],
  "Hopeful": ["#FF9A9E", "#FDA085", "#F6D365", "#F77062", "#2A0845"],
  "Reflective": ["#8E2DE2", "#12C2E9", "#F64F59", "#4A00E0", "#0D0015"],
  "Seeking Sabr": ["#3F6C91", "#BA8A47", "#879EB3", "#A3907F", "#E8DCD1"],
  
  // New Premium Palettes
  "Dusty Rose": ["#C97884", "#D9A5B3", "#F6E6E9", "#A65D67", "#C97884"],
  "Olive Sage": ["#556B2F", "#7A8F54", "#C7D3A4", "#3E4E22", "#556B2F"],
  "Burgundy": ["#5C1A1B", "#8B3A3A", "#D8A7A7", "#3D1112", "#5C1A1B"],
  "Mocha": ["#6F4E37", "#A67B5B", "#EAD7C0", "#4A3425", "#6F4E37"],
  "Slate Blue": ["#40566B", "#708090", "#D6E0E8", "#2B3A48", "#40566B"],
  "Terracotta": ["#B5654A", "#D99873", "#F3D9C9", "#8B4D38", "#B5654A"],
  "Charcoal Gold": ["#2C2C2C", "#5E5E5E", "#D4AF37", "#1A1A1A", "#2C2C2C"],
  "Deep Plum": ["#4A235A", "#7D5A8C", "#D8C3E3", "#34183F", "#4A235A"],
  "Ivory Sand": ["#F5EFE6", "#DCC7AA", "#B89B72", "#EBE3D5", "#F5EFE6"],
  "Emerald": ["#0F5132", "#4F7942", "#B08D57", "#0A3621", "#0F5132"],
};

export const SPIRITUAL_MOODS = ["Peaceful", "Grateful", "Hopeful", "Reflective", "Seeking Sabr"];
export const COMMON_COLORS = ["Dusty Rose", "Olive Sage", "Burgundy", "Mocha", "Slate Blue", "Terracotta", "Charcoal Gold", "Deep Plum", "Ivory Sand", "Emerald"];
export const MOODS_LIST = [...SPIRITUAL_MOODS, ...COMMON_COLORS];
export const MOOD_PALETTES = PALETTES; // For backward compatibility if needed

export const generateMeshGradient = (colors: string[], variant: number) => {
  const configs = [
    [
      `radial-gradient(circle at 0% 0%, ${colors[0]} 0%, transparent 80%)`,
      `radial-gradient(circle at 100% 0%, ${colors[1]} 0%, transparent 80%)`,
      `radial-gradient(circle at 100% 100%, ${colors[2]} 0%, transparent 80%)`,
      `radial-gradient(circle at 0% 100%, ${colors[3]} 0%, transparent 80%)`,
    ],
    [
      `radial-gradient(ellipse at 50% 0%, ${colors[1]} 0%, transparent 100%)`,
      `radial-gradient(ellipse at 100% 50%, ${colors[2]} 0%, transparent 100%)`,
      `radial-gradient(ellipse at 50% 100%, ${colors[3]} 0%, transparent 100%)`,
      `radial-gradient(ellipse at 0% 50%, ${colors[0]} 0%, transparent 100%)`,
    ],
    [
      `radial-gradient(circle at 20% 20%, ${colors[2]} 0%, transparent 90%)`,
      `radial-gradient(circle at 80% 80%, ${colors[3]} 0%, transparent 90%)`,
      `radial-gradient(circle at 80% 20%, ${colors[0]} 0%, transparent 80%)`,
      `radial-gradient(circle at 20% 80%, ${colors[1]} 0%, transparent 80%)`,
    ],
    [
      `radial-gradient(circle at 50% 50%, ${colors[3]} 0%, transparent 100%)`,
      `radial-gradient(circle at 0% 0%, ${colors[0]} 0%, transparent 80%)`,
      `radial-gradient(circle at 100% 100%, ${colors[1]} 0%, transparent 80%)`,
      `radial-gradient(circle at 0% 100%, ${colors[2]} 0%, transparent 70%)`,
    ],
    [
      `radial-gradient(ellipse at 10% 90%, ${colors[0]} 0%, transparent 90%)`,
      `radial-gradient(ellipse at 90% 10%, ${colors[3]} 0%, transparent 90%)`,
      `radial-gradient(ellipse at 90% 90%, ${colors[1]} 0%, transparent 80%)`,
      `radial-gradient(ellipse at 10% 10%, ${colors[2]} 0%, transparent 80%)`,
    ]
  ];
  
  if (variant < 0 || !configs.length) return '';
  
  const selectedConfig = configs[variant % configs.length];
  return selectedConfig ? selectedConfig.join(',\n          ') : '';
};
