const HINGLISH_DICTIONARY: Record<string, string> = {
  // Common Figures
  "The Messenger of Allah": "Allah ke Rasool",
  "Messenger of Allah": "Allah ke Rasool",
  "The Prophet": "Nabi Kareem",
  "Prophet": "Nabi",
  "Messenger": "Rasool",
  "Allah": "Allah",
  "Lord": "Rabb",
  "Companion": "Sahabi",
  "Companions": "Sahaba",

  // Action Verbs (Hadith context)
  "said": "ne farmaya",
  "narrated": "se riwayat hai",
  "reported": "ne report kiya",
  "heard": "ne suna",
  "asked": "ne pucha",
  "ordered": "ne hukum diya",
  "prohibited": "se mana kiya",
  "told": "ne bataya",

  // Core Concepts
  "Faith": "Imaan",
  "Belief": "Yaqeen",
  "Prayer": "Namaz",
  "Prayers": "Namazen",
  "Fasting": "Roza",
  "Fast": "Roza",
  "Charity": "Zakaat/Sadqa",
  "Alms": "Zakaat",
  "Paradise": "Jannat",
  "Hell": "Jahannam",
  "Hellfire": "Jahannam ki aag",
  "Judgment Day": "Qayamat ka din",
  "Day of Resurrection": "Qayamat ka din",
  "Heaven": "Aasman/Jannat",
  "Heart": "Dil",
  "Hearts": "Dilon",
  "Soul": "Rooh",
  "Truth": "Sach",
  "Falsehood": "Jhoot",
  "Knowledge": "Ilm",
  "Wisdom": "Hikmat",
  "Patience": "Sabr",
  "Mercy": "Rehmat",
  "Forgiveness": "Maghfirat",
  "Sin": "Gunah",
  "Sins": "Gunahon",
  "Good deeds": "Nekiyan",
  "Evil deeds": "Bure kaam",

  // Connectors & Emphasis
  "Verily": "Yaqeenan",
  "Indeed": "Beshak",
  "Surely": "Zaroor",
  "Certainly": "Beshak",
  "Avoid": "Bacho",
  "Beware": "Hoshiyar raho",
  "Listen": "Suno",
  "Follow": "Pairwi karo",
  "None of you": "Tum mein se koi bhi",
  "Truly believes": "sacha imaan wala",
  "until": "jab tak ke",
  "he loves": "woh pasand kare",
  "his brother": "apne bhai",
  "himself": "khud",
  "best among you": "tum mein se behtareen",
  "manners": "akhlaq",
  "character": "character/akhlaq",
  "intention": "niyat",
  "intentions": "niyaton",
  "actions": "aamal",
};

export function localTranslateToHinglish(text: string): string {
  let result = text;

  // Sort keys by length descending to replace longest phrases first
  const sortedKeys = Object.keys(HINGLISH_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    // Case-insensitive replacement with word boundary check
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKey}\\b`, 'gi');
    
    result = result.replace(regex, (matched) => {
      const replacement = HINGLISH_DICTIONARY[key];
      // Try to match the case of the first letter
      if (matched[0] === matched[0].toUpperCase()) {
        return replacement[0].toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  return result;
}
