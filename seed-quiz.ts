import dbConnect from './src/lib/mongodb';
import QuizQuestion from './src/models/QuizQuestion';

const QUIZ_DATA = [
  // Level 1: Foundations of Islam (Basics)
  {
    level: 1,
    category: 'Foundations',
    question: 'How many pillars of Islam are there?',
    options: ['3', '4', '5', '7'],
    correctAnswer: '5',
    explanation: 'Islam is built upon five pillars: Shahadah, Salah, Zakat, Sawm, and Hajj.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'What is the first pillar of Islam?',
    options: ['Salah', 'Shahadah', 'Zakat', 'Sawm'],
    correctAnswer: 'Shahadah',
    explanation: 'The Shahadah (Declaration of Faith) is the first and most fundamental pillar of Islam.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'Which direction do Muslims face during prayer?',
    options: ['East', 'West', 'The Kaaba in Makkah', 'The Sun'],
    correctAnswer: 'The Kaaba in Makkah',
    explanation: 'Muslims face the Qibla, which is the direction of the Kaaba in Makkah.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'How many times a day is Salah (prayer) mandatory?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '5',
    explanation: 'Five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) are mandatory for every adult Muslim.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'What is the holy book of Islam?',
    options: ['Torah', 'Bible', 'Quran', 'Psalms'],
    correctAnswer: 'Quran',
    explanation: 'The Quran is the word of Allah revealed to Prophet Muhammad (SAW).',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'What is the holy month of fasting called?',
    options: ['Muharram', 'Ramadan', 'Shawwal', 'Dhul-Hijjah'],
    correctAnswer: 'Ramadan',
    explanation: 'Ramadan is the ninth month of the Islamic calendar, observed by Muslims worldwide as a month of fasting.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'What is the mandatory charity given to the poor called?',
    options: ['Sadaqah', 'Zakat', 'Fitrana', 'Waqf'],
    correctAnswer: 'Zakat',
    explanation: 'Zakat is the third pillar of Islam, requiring Muslims to give 2.5% of their qualifying wealth to the needy.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'Who was the first woman to embrace Islam?',
    options: ['Aisha (RA)', 'Fatima (RA)', 'Khadija (RA)', 'Safiyyah (RA)'],
    correctAnswer: 'Khadija (RA)',
    explanation: 'Khadija bint Khuwaylid (RA), the Prophet\'s (SAW) first wife, was the first person to accept Islam.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'How many times must a Muslim perform Hajj if they are able?',
    options: ['Once', 'Twice', 'Every year', 'Ten times'],
    correctAnswer: 'Once',
    explanation: 'Hajj is mandatory once in a lifetime for those who are physically and financially capable.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'In which city was Prophet Muhammad (SAW) born?',
    options: ['Madinah', 'Jerusalem', 'Makkah', 'Taif'],
    correctAnswer: 'Makkah',
    explanation: 'Prophet Muhammad (SAW) was born in the city of Makkah in 570 CE.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'Who was the first adult male to embrace Islam?',
    options: ['Abu Bakr (RA)', 'Umar (RA)', 'Uthman (RA)', 'Ali (RA)'],
    correctAnswer: 'Abu Bakr (RA)',
    explanation: 'Abu Bakr as-Siddiq (RA) was the first adult male and the closest friend of the Prophet (SAW) to accept Islam.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'What is the language of the Quran?',
    options: ['Persian', 'Turkish', 'Arabic', 'Urdu'],
    correctAnswer: 'Arabic',
    explanation: 'The Quran was revealed in the Arabic language to Prophet Muhammad (SAW).',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'What is the name of the prayer performed at dawn?',
    options: ['Isha', 'Asr', 'Fajr', 'Maghrib'],
    correctAnswer: 'Fajr',
    explanation: 'Fajr is the first of the five daily prayers, performed before sunrise.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'Which angel brought the revelation to the Prophet (SAW)?',
    options: ['Mikail', 'Israfil', 'Jibril', 'Izrail'],
    correctAnswer: 'Jibril',
    explanation: 'Angel Jibril (Gabriel) was responsible for delivering Allah\'s messages to all Prophets.',
    difficulty: 'easy'
  },
  {
    level: 1,
    category: 'Foundations',
    question: 'How many names of Allah are traditionally mentioned?',
    options: ['33', '66', '99', '114'],
    correctAnswer: '99',
    explanation: 'There are 99 known names (attributes) of Allah mentioned in the Quran and Sunnah.',
    difficulty: 'easy'
  },

  // Level 2: Quran & Hadith Knowledge
  {
    level: 2,
    category: 'Quran',
    question: 'How many Surahs in the Quran are classified as "Makki"?',
    options: ['28', '66', '86', '114'],
    correctAnswer: '86',
    explanation: 'Out of 114 Surahs, 86 are Makki (revealed in Makkah) and 28 are Madani (revealed in Madinah).',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'Which Surah is known as the "Heart of the Quran"?',
    options: ['Surah Al-Baqarah', 'Surah Yaseen', 'Surah Al-Mulk', 'Surah Ar-Rahman'],
    correctAnswer: 'Surah Yaseen',
    explanation: 'Surah Yaseen is often referred to as the heart of the Quran in various narrations.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'What is the longest verse in the Quran?',
    options: ['Ayat al-Kursi', 'Ayat al-Dayn (Debt)', 'The last verse of Al-Baqarah', 'The first verse of An-Nisa'],
    correctAnswer: 'Ayat al-Dayn (Debt)',
    explanation: 'Verse 282 of Surah Al-Baqarah (The Verse of Debt) is the longest single verse in the Quran.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'Which Surah does not start with "Bismillah"?',
    options: ['Surah At-Tawbah', 'Surah Al-Alaq', 'Surah An-Naml', 'Surah Al-Fil'],
    correctAnswer: 'Surah At-Tawbah',
    explanation: 'Surah At-Tawbah is the only chapter that does not begin with the Basmalah.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Hadith',
    question: 'Which Sahabi narrated the highest number of Hadiths?',
    options: ['Abu Bakr (RA)', 'Aisha (RA)', 'Abu Hurairah (RA)', 'Abdullah ibn Umar (RA)'],
    correctAnswer: 'Abu Hurairah (RA)',
    explanation: 'Abu Hurairah (RA) narrated 5,374 Hadiths, more than any other companion.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'In which Surah is the story of "The Dwellers of the Cave" mentioned?',
    options: ['Surah Al-Kahf', 'Surah Maryam', 'Surah Yusuf', 'Surah Al-Anbiya'],
    correctAnswer: 'Surah Al-Kahf',
    explanation: 'The story of the youths who slept in a cave for over 300 years is told in Surah Al-Kahf.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'Which animal is mentioned in the Quran as being spoken to by Prophet Sulaiman (AS)?',
    options: ['A Bee', 'An Ant', 'A Spider', 'A Camel'],
    correctAnswer: 'An Ant',
    explanation: 'In Surah An-Naml (The Ants), Prophet Sulaiman (AS) hears and smiles at the speech of an ant.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'What was the first word of the Quran revealed to the Prophet (SAW)?',
    options: ['Allah', 'Islam', 'Iqra', 'Bismillah'],
    correctAnswer: 'Iqra',
    explanation: 'The first word revealed was "Iqra" (Read/Proclaim) in Surah Al-Alaq.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Hadith',
    question: 'Which book is considered the most authentic after the Quran?',
    options: ['Sahih Muslim', 'Sahih Bukhari', 'Sunan Abu Dawood', 'Muwatta Imam Malik'],
    correctAnswer: 'Sahih Bukhari',
    explanation: 'Sahih Al-Bukhari is widely regarded by scholars as the most authentic collection of Hadith.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'How many Sajdah (prostrations) are there in the Quran?',
    options: ['10', '12', '14', '15'],
    correctAnswer: '14',
    explanation: 'There are 14 verses in the Quran where prostration (Sajdah al-Tilawah) is required or recommended.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'Which Surah is named after a woman?',
    options: ['Surah Aisha', 'Surah Maryam', 'Surah Fatima', 'Surah Khadija'],
    correctAnswer: 'Surah Maryam',
    explanation: 'Surah Maryam is named after the mother of Prophet Isa (AS).',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'What is the meaning of "Al-Kawthar"?',
    options: ['The Camel', 'The Abundance', 'The Morning', 'The Evening'],
    correctAnswer: 'The Abundance',
    explanation: 'Al-Kawthar refers to a river in Paradise and the abundance of good given to the Prophet (SAW).',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Hadith',
    question: 'Who compiled the "Sahih Muslim"?',
    options: ['Imam Bukhari', 'Imam Muslim', 'Imam Tirmidhi', 'Imam Malik'],
    correctAnswer: 'Imam Muslim',
    explanation: 'Muslim ibn al-Hajjaj (Imam Muslim) compiled the second most authentic Hadith collection.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'Which Surah is called "The Beauty of the Quran"?',
    options: ['Surah Ar-Rahman', 'Surah Yaseen', 'Surah Al-Mulk', 'Surah An-Nur'],
    correctAnswer: 'Surah Ar-Rahman',
    explanation: 'Surah Ar-Rahman is known as the "Arous al-Quran" or the Beauty of the Quran.',
    difficulty: 'medium'
  },
  {
    level: 2,
    category: 'Quran',
    question: 'How many years did it take for the complete revelation of the Quran?',
    options: ['10 years', '13 years', '23 years', '40 years'],
    correctAnswer: '23 years',
    explanation: 'The Quran was revealed gradually over a period of approximately 23 years.',
    difficulty: 'medium'
  },

  // Level 3: Prophets (Stories & Miracles)
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was given the power to control the wind and talk to animals?',
    options: ['Sulaiman (AS)', 'Dawud (AS)', 'Yusuf (AS)', 'Ibrahim (AS)'],
    correctAnswer: 'Sulaiman (AS)',
    explanation: 'Allah granted Prophet Sulaiman (AS) miracles like understanding animals and commanding the winds.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was swallowed by a large fish (whale)?',
    options: ['Yunus (AS)', 'Lut (AS)', 'Ishaq (AS)', 'Yahya (AS)'],
    correctAnswer: 'Yunus (AS)',
    explanation: 'Prophet Yunus (AS) was swallowed by a whale and spent three days and nights in its belly while praying to Allah.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet had the miracle of bringing the dead back to life by Allah\'s permission?',
    options: ['Musa (AS)', 'Isa (AS)', 'Ibrahim (AS)', 'Nuh (AS)'],
    correctAnswer: 'Isa (AS)',
    explanation: 'Prophet Isa (AS) was given miracles like healing the blind and raising the dead, all by Allah\'s leave.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Who was the Prophet sent to the people of Thamud?',
    options: ['Salih (AS)', 'Hud (AS)', 'Shuayb (AS)', 'Idris (AS)'],
    correctAnswer: 'Salih (AS)',
    explanation: 'Prophet Salih (AS) was sent to Thamud, and his miracle was the miraculous she-camel.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet is known as "Khalilullah" (Friend of Allah)?',
    options: ['Musa (AS)', 'Ibrahim (AS)', 'Nuh (AS)', 'Ismail (AS)'],
    correctAnswer: 'Ibrahim (AS)',
    explanation: 'Prophet Ibrahim (AS) was honored with the title Friend of Allah.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was known for his extraordinary patience during a long illness?',
    options: ['Ayyub (AS)', 'Yaqub (AS)', 'Harun (AS)', 'Zakariya (AS)'],
    correctAnswer: 'Ayyub (AS)',
    explanation: 'Prophet Ayyub (AS) remained patient and grateful to Allah throughout 18 years of severe illness and loss.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Who was the father of Prophet Yusuf (AS)?',
    options: ['Ishaq (AS)', 'Yaqub (AS)', 'Ibrahim (AS)', 'Musa (AS)'],
    correctAnswer: 'Yaqub (AS)',
    explanation: 'Prophet Yaqub (AS) was the father of Yusuf (AS) and he wept until he lost his sight due to the loss of Yusuf.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was given the miracle of softening iron with his hands?',
    options: ['Sulaiman (AS)', 'Dawud (AS)', 'Musa (AS)', 'Isa (AS)'],
    correctAnswer: 'Dawud (AS)',
    explanation: 'Allah made iron soft for Prophet Dawud (AS) so he could make coats of mail.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was born without a father?',
    options: ['Yahya (AS)', 'Isa (AS)', 'Adam (AS)', 'Idris (AS)'],
    correctAnswer: 'Isa (AS)',
    explanation: 'Prophet Isa (AS) was born to Maryam (AS) through a miracle of Allah without a father.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet spoke to Allah directly on Mount Sinai?',
    options: ['Muhammad (SAW)', 'Musa (AS)', 'Ibrahim (AS)', 'Nuh (AS)'],
    correctAnswer: 'Musa (AS)',
    explanation: 'Prophet Musa (AS) is known as "Kaleemullah" because he spoke to Allah directly.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet built the Kaaba with his son?',
    options: ['Ibrahim (AS) & Ishaq (AS)', 'Ibrahim (AS) & Ismail (AS)', 'Adam (AS) & Seth (AS)', 'Nuh (AS) & Shem'],
    correctAnswer: 'Ibrahim (AS) & Ismail (AS)',
    explanation: 'Prophet Ibrahim (AS) and his son Ismail (AS) built the foundations of the Kaaba in Makkah.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was given the miracle of a hand that glowed white?',
    options: ['Isa (AS)', 'Musa (AS)', 'Muhammad (SAW)', 'Sulaiman (AS)'],
    correctAnswer: 'Musa (AS)',
    explanation: 'One of the miracles given to Musa (AS) was that his hand would shine white when he placed it in his cloak.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Who was the Prophet sent to the people of Madyan?',
    options: ['Salih (AS)', 'Shuayb (AS)', 'Hud (AS)', 'Lut (AS)'],
    correctAnswer: 'Shuayb (AS)',
    explanation: 'Prophet Shuayb (AS) was sent to Madyan to guide them away from cheating in trade.',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet was known as the "Messenger of the Covenant"?',
    options: ['Yahya (AS)', 'Zakariya (AS)', 'Ilyas (AS)', 'Al-Yasa (AS)'],
    correctAnswer: 'Yahya (AS)',
    explanation: 'Yahya (AS) (John the Baptist) was a Prophet who confirmed the word of Allah and the coming of Isa (AS).',
    difficulty: 'medium'
  },
  {
    level: 3,
    category: 'Prophets',
    question: 'Which Prophet survived being thrown into a massive fire?',
    options: ['Musa (AS)', 'Ibrahim (AS)', 'Nuh (AS)', 'Lut (AS)'],
    correctAnswer: 'Ibrahim (AS)',
    explanation: 'When Nimrod threw Ibrahim (AS) into the fire, Allah commanded the fire to be "cool and peaceful" for him.',
    difficulty: 'medium'
  },

  // Level 4: Sahabah (Companions)
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which Sahabi was known as the "Sword of Allah"?',
    options: ['Ali ibn Abi Talib', 'Hamza ibn Abdul-Muttalib', 'Khalid ibn al-Walid', 'Umar ibn al-Khattab'],
    correctAnswer: 'Khalid ibn al-Walid',
    explanation: 'Khalid ibn al-Walid (RA) was given the title "Saifullah" (Sword of Allah) for his military prowess.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Who was the first martyr (Shaheed) of Islam?',
    options: ['Bilal ibn Rabah', 'Sumayyah bint Khayyat', 'Yasir ibn Amir', 'Hamza (RA)'],
    correctAnswer: 'Sumayyah bint Khayyat',
    explanation: 'Sumayyah (RA), the mother of Ammar ibn Yasir, was the first person to be martyred for Islam.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which companion was known as the "Secretary of the Revelation"?',
    options: ['Zaid ibn Thabit', 'Abdullah ibn Abbas', 'Uthman ibn Affan', 'Ali ibn Abi Talib'],
    correctAnswer: 'Zaid ibn Thabit',
    explanation: 'Zaid ibn Thabit (RA) was the primary scribe who recorded the Quranic revelations.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which companion was nicknamed "Dhu al-Nurayn" (Possessor of Two Lights)?',
    options: ['Abu Bakr (RA)', 'Uthman ibn Affan', 'Umar (RA)', 'Ali (RA)'],
    correctAnswer: 'Uthman ibn Affan',
    explanation: 'Uthman (RA) was called this because he married two of the Prophet\'s (SAW) daughters, Ruqayyah and Umm Kulthum.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Who was the first Muezzin (caller to prayer) in Islam?',
    options: ['Abu Bakr (RA)', 'Bilal ibn Rabah', 'Ammar ibn Yasir', 'Zaid ibn Harithah'],
    correctAnswer: 'Bilal ibn Rabah',
    explanation: 'Bilal (RA) was chosen by the Prophet (SAW) to be the first person to call the Adhan.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which companion did the Prophet (SAW) describe as "The Trustworthy One of this Ummah"?',
    options: ['Abu Ubaidah ibn al-Jarrah', 'Sa\'d ibn Abi Waqqas', 'Abdur-Rahman ibn Awf', 'Talhah ibn Ubaydullah'],
    correctAnswer: 'Abu Ubaidah ibn al-Jarrah',
    explanation: 'Abu Ubaidah (RA) was one of the ten promised paradise and known for his integrity.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which Sahabi was the first child to embrace Islam?',
    options: ['Zaid ibn Harithah', 'Ali ibn Abi Talib', 'Abdullah ibn Zubayr', 'Hasan ibn Ali'],
    correctAnswer: 'Ali ibn Abi Talib',
    explanation: 'Ali (RA) accepted Islam at the age of 10, becoming the first child to do so.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which Sahabi was known as the "Interpreter of the Quran"?',
    options: ['Abdullah ibn Mas\'ud', 'Abdullah ibn Abbas', 'Muadh ibn Jabal', 'Ubayy ibn Ka\'b'],
    correctAnswer: 'Abdullah ibn Abbas',
    explanation: 'Ibn Abbas (RA) was highly learned in Quranic interpretation due to a special Dua made for him by the Prophet (SAW).',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which companion was known as the "Lion of Allah"?',
    options: ['Umar (RA)', 'Ali (RA)', 'Hamza ibn Abdul-Muttalib', 'Khalid ibn al-Walid'],
    correctAnswer: 'Hamza ibn Abdul-Muttalib',
    explanation: 'Hamza (RA), the uncle of the Prophet (SAW), was called "Asadullah" for his bravery.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Who was the only companion mentioned by name in the Quran?',
    options: ['Abu Bakr (RA)', 'Zaid ibn Harithah', 'Uthman (RA)', 'Ali (RA)'],
    correctAnswer: 'Zaid ibn Harithah',
    explanation: 'Zaid (RA) is the only Sahabi mentioned by name, in Surah Al-Ahzab (verse 37).',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which companion was known as "The Keeper of the Secret"?',
    options: ['Hudhayfah ibn al-Yaman', 'Salman al-Farisi', 'Abu Dharr al-Ghifari', 'Anas ibn Malik'],
    correctAnswer: 'Hudhayfah ibn al-Yaman',
    explanation: 'The Prophet (SAW) entrusted Hudhayfah (RA) with the names of the hypocrites (Munafiqun).',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Who was the companion that suggested digging a trench during the Battle of Al-Ahzab?',
    options: ['Amr ibn al-Aas', 'Salman al-Farisi', 'Sa\'d ibn Mu\'adh', 'Abu Ubaidah (RA)'],
    correctAnswer: 'Salman al-Farisi',
    explanation: 'Salman al-Farisi (RA) introduced the Persian tactic of digging a trench to protect the city.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which female companion was known for her military bravery at the Battle of Uhud?',
    options: ['Nusaybah bint Ka\'b', 'Asma bint Abi Bakr', 'Khawla bint al-Azwar', 'Hind bint Utbah'],
    correctAnswer: 'Nusaybah bint Ka\'b',
    explanation: 'Also known as Umm Ummarah, she shield the Prophet (SAW) during the most difficult moments of the battle.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Which companion is known as the "Imam of the Scholars"?',
    options: ['Abdullah ibn Mas\'ud', 'Muadh ibn Jabal', 'Abdullah ibn Umar', 'Ubayy ibn Ka\'b'],
    correctAnswer: 'Muadh ibn Jabal',
    explanation: 'The Prophet (SAW) said that Muadh (RA) will lead the scholars on the Day of Judgment.',
    difficulty: 'hard'
  },
  {
    level: 4,
    category: 'Sahabah',
    question: 'Who was the Sahabi that resembled Angel Jibril (AS) in appearance?',
    options: ['Dihyah al-Kalbi', 'Mus\'ab ibn Umayr', 'Jafar ibn Abi Talib', 'Zubair ibn al-Awwam'],
    correctAnswer: 'Dihyah al-Kalbi',
    explanation: 'Angel Jibril (AS) would often come in the human form of the handsome companion Dihyah al-Kalbi (RA).',
    difficulty: 'hard'
  },

  // Level 5: Islamic History & Civilization (Advanced)
  {
    level: 5,
    category: 'History',
    question: 'In which year did the Battle of Badr take place?',
    options: ['1 AH', '2 AH', '3 AH', '5 AH'],
    correctAnswer: '2 AH',
    explanation: 'The Battle of Badr, the first major battle of Islam, occurred in the second year after the Hijrah.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Who was the second Caliph of Islam?',
    options: ['Umar ibn al-Khattab', 'Uthman ibn Affan', 'Ali ibn Abi Talib', 'Abu Bakr (RA)'],
    correctAnswer: 'Umar ibn al-Khattab',
    explanation: 'Umar al-Faruq (RA) succeeded Abu Bakr (RA) as the second leader of the Muslim world.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'In which city is the Dome of the Rock located?',
    options: ['Makkah', 'Madinah', 'Jerusalem', 'Cairo'],
    correctAnswer: 'Jerusalem',
    explanation: 'The Dome of the Rock is located on the Temple Mount in the Old City of Jerusalem.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Who founded the "House of Wisdom" (Bayt al-Hikma) in Baghdad?',
    options: ['Harun al-Rashid', 'Al-Ma\'mun', 'Salahuddin Ayyubi', 'Umar ibn Abdul Aziz'],
    correctAnswer: 'Harun al-Rashid',
    explanation: 'The Abbasid Caliph Harun al-Rashid established this major intellectual center during the Islamic Golden Age.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Which treaty was signed between the Muslims and the Quraysh in 6 AH?',
    options: ['Treaty of Madinah', 'Treaty of Hudaybiyyah', 'Treaty of Aqaba', 'Treaty of Taif'],
    correctAnswer: 'Treaty of Hudaybiyyah',
    explanation: 'This 10-year peace treaty paved the way for the conquest of Makkah two years later.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'Civilization',
    question: 'Who is known as the "Father of Algebra"?',
    options: ['Al-Biruni', 'Al-Khwarizmi', 'Ibn Sina', 'Al-Razi'],
    correctAnswer: 'Al-Khwarizmi',
    explanation: 'Muhammad ibn Musa al-Khwarizmi\'s work laid the foundations for algebra and algorithms.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Which Caliph was known as the "Fifth Rightly Guided Caliph"?',
    options: ['Muawiyah I', 'Umar ibn Abdul Aziz', 'Harun al-Rashid', 'Al-Walid I'],
    correctAnswer: 'Umar ibn Abdul Aziz',
    explanation: 'Umar II (RA) is honored with this title due to his immense justice and piety during his short reign.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Who led the Muslim army to victory in the Battle of Hattin, liberating Jerusalem?',
    options: ['Tariq ibn Ziyad', 'Salahuddin Ayyubi', 'Saifuddin Qutuz', 'Khalid ibn al-Walid'],
    correctAnswer: 'Salahuddin Ayyubi',
    explanation: 'Salahuddin (Saladin) defeated the Crusaders at Hattin in 1187 CE.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Which companion migrated to Abyssinia and spoke to the Negus (Najashi) on behalf of Muslims?',
    options: ['Jafar ibn Abi Talib', 'Mus\'ab ibn Umayr', 'Uthman ibn Affan', 'Zaid ibn Thabit'],
    correctAnswer: 'Jafar ibn Abi Talib',
    explanation: 'Jafar (RA) delivered a powerful speech about Islam to King Najashi, who then granted them protection.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'How long did the Khilafah of Abu Bakr (RA) last?',
    options: ['2 years', '5 years', '10 years', '12 years'],
    correctAnswer: '2 years',
    explanation: 'Abu Bakr (RA) served as the first Caliph for approximately two years (632-634 CE).',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'Civilization',
    question: 'Which Islamic scholar wrote "The Canon of Medicine", a standard medical text for centuries?',
    options: ['Al-Razi', 'Ibn Sina', 'Ibn Rushd', 'Al-Zahrawi'],
    correctAnswer: 'Ibn Sina',
    explanation: 'Ibn Sina (Avicenna) was one of the most significant physicians and philosophers of the Islamic Golden Age.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'In which year did the conquest of Makkah (Fath Makkah) occur?',
    options: ['6 AH', '8 AH', '9 AH', '10 AH'],
    correctAnswer: '8 AH',
    explanation: 'The Prophet (SAW) entered Makkah peacefully in the year 8 AH (630 CE).',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Which Sahabi is buried in Istanbul (then Constantinople)?',
    options: ['Abu Ayub al-Ansari', 'Sa\'d ibn Abi Waqqas', 'Abu Dharr al-Ghifari', 'Bilal (RA)'],
    correctAnswer: 'Abu Ayub al-Ansari',
    explanation: 'Abu Ayub (RA) died during the first siege of Constantinople and was buried near the city walls.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Who was the commander of the Muslim forces at the Battle of Qadisiyyah?',
    options: ['Sa\'d ibn Abi Waqqas', 'Amr ibn al-Aas', 'Ubaydah ibn al-Jarrah', 'Sa\'id ibn Zayd'],
    correctAnswer: 'Sa\'d ibn Abi Waqqas',
    explanation: 'Sa\'d (RA) led the Muslims to a decisive victory against the Sassanid Empire.',
    difficulty: 'hard'
  },
  {
    level: 5,
    category: 'History',
    question: 'Which Caliph standardized the Uthmanic codex (Mushaf) of the Quran?',
    options: ['Abu Bakr (RA)', 'Umar (RA)', 'Uthman ibn Affan', 'Ali (RA)'],
    correctAnswer: 'Uthman ibn Affan',
    explanation: 'Uthman (RA) oversaw the compilation of the definitive version of the Quran to ensure unity among Muslims.',
    difficulty: 'hard'
  }
];

async function seed() {
  await dbConnect();
  console.log('Connected to DB');
  
  await QuizQuestion.deleteMany({});
  console.log('Cleared existing questions');
  
  await QuizQuestion.insertMany(QUIZ_DATA);
  console.log('Inserted 75 authentic knowledge questions across 5 levels');
  
  process.exit(0);
}

seed();
