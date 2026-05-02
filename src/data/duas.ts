export type Category = {
  id: string;
  title: string;
  iconName: string;
};

export type Dua = {
  id: string;
  categoryId: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
};

export const categories: Category[] = [
  { id: "morning", title: "Morning Duas", iconName: "Sun" },
  { id: "evening", title: "Evening Duas", iconName: "Moon" },
  { id: "eating-before", title: "Before Eating", iconName: "Utensils" },
  { id: "eating-after", title: "After Eating", iconName: "Coffee" },
  { id: "drinking-before", title: "Before Drinking Water", iconName: "Droplets" },
  { id: "drinking-after", title: "After Drinking Water", iconName: "CheckCircle" },
  { id: "sleeping", title: "Before Sleeping", iconName: "Bed" },
  { id: "waking", title: "After Waking Up", iconName: "Sun" },
  { id: "home-enter", title: "Entering Home", iconName: "Home" },
  { id: "home-leave", title: "Leaving Home", iconName: "LogOut" },
  { id: "masjid-enter", title: "Entering Masjid", iconName: "BookOpen" },
  { id: "masjid-leave", title: "Leaving Masjid", iconName: "BookOpen" },
  { id: "bathroom-enter", title: "Entering Bathroom", iconName: "Shield" },
  { id: "bathroom-leave", title: "Leaving Bathroom", iconName: "ShieldCheck" },
  { id: "wudu-before", title: "Before Wudu", iconName: "Droplets" },
  { id: "wudu-after", title: "After Wudu", iconName: "Droplet" },
  { id: "travel", title: "Travel Duas", iconName: "Map" },
  { id: "parents", title: "Parents Dua", iconName: "Heart" },
  { id: "forgiveness", title: "Forgiveness Dua", iconName: "Feather" },
  { id: "protection", title: "Protection Dua", iconName: "Shield" },
  { id: "stress", title: "Stress & Anxiety", iconName: "CloudRain" },
  { id: "gratitude", title: "Gratitude Dua", iconName: "Smile" },
  { id: "sick", title: "Sick Person Dua", iconName: "Activity" },
  { id: "rain", title: "Rain Dua", iconName: "Cloud" },
  { id: "clothes-wear", title: "Wearing Clothes", iconName: "User" },
  { id: "clothes-remove", title: "Removing Clothes", iconName: "UserMinus" },
];

export const duas: Dua[] = [
  {
    id: "eating-before-1",
    categoryId: "eating-before",
    title: "Before Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah.",
    reference: "Sunan Abi Dawood — Hadith 3767"
  },
  {
    id: "eating-after-1",
    categoryId: "eating-after",
    title: "After Eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdulillahil-ladhi at‘amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah.",
    translation: "All praise is for Allah who fed me this and provided it for me without any power or strength from me.",
    reference: "Sunan Abi Dawood — Hadith 4023"
  },
  {
    id: "sleeping-1",
    categoryId: "sleeping",
    title: "Before Sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amootu wa ahya.",
    translation: "O Allah, in Your name I die and I live.",
    reference: "Sahih al-Bukhari — Hadith 6324"
  },
  {
    id: "waking-1",
    categoryId: "waking",
    title: "After Waking Up",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdulillahil-ladhi ahyana ba‘da ma amatana wa ilayhin-nushoor.",
    translation: "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.",
    reference: "Sahih al-Bukhari — Hadith 6312"
  },
  {
    id: "home-enter-1",
    categoryId: "home-enter",
    title: "Entering Home",
    arabic: "بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Bismillahi walajna wa bismillahi kharajna wa ‘ala Rabbina tawakkalna.",
    translation: "In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.",
    reference: "Sunan Abi Dawood — Hadith 5096"
  },
  {
    id: "home-leave-1",
    categoryId: "home-leave",
    title: "Leaving Home",
    arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillah, tawakkaltu ‘alallah, wa la hawla wa la quwwata illa billah.",
    translation: "In the name of Allah, I place my trust in Allah, and there is no power and no strength except with Allah.",
    reference: "Sunan Abi Dawood — Hadith 5095"
  },
  {
    id: "bathroom-enter-1",
    categoryId: "bathroom-enter",
    title: "Entering Bathroom (Baitul Khala)",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    transliteration: "Allahumma inni a‘oodhu bika minal-khubthi wal-khaba’ith.",
    translation: "O Allah, I seek refuge in You from male and female evil spirits.",
    reference: "Sahih al-Bukhari — Hadith 142"
  },
  {
    id: "bathroom-leave-1",
    categoryId: "bathroom-leave",
    title: "Leaving Bathroom",
    arabic: "غُفْرَانَكَ",
    transliteration: "Ghufranak.",
    translation: "I seek Your forgiveness.",
    reference: "Sunan Ibn Majah — Hadith 300"
  },
  {
    id: "wudu-before-1",
    categoryId: "wudu-before",
    title: "Before Wudu",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah.",
    translation: "In the name of Allah.",
    reference: "Sunan Ibn Majah — Hadith 397"
  },
  {
    id: "wudu-after-1",
    categoryId: "wudu-after",
    title: "After Wudu",
    arabic: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "Ashhadu an la ilaha illallah wahdahu la sharika lah, wa ashhadu anna Muhammadan ‘abduhu wa rasooluh.",
    translation: "I bear witness that there is no god except Allah alone without partner, and I bear witness that Muhammad is His servant and Messenger.",
    reference: "Sahih Muslim — Hadith 234"
  },
  {
    id: "masjid-enter-1",
    categoryId: "masjid-enter",
    title: "Entering Masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahumma iftah li abwaba rahmatik.",
    translation: "O Allah, open for me the doors of Your mercy.",
    reference: "Sahih Muslim — Hadith 713"
  },
  {
    id: "masjid-leave-1",
    categoryId: "masjid-leave",
    title: "Leaving Masjid",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allahumma inni as’aluka min fadlik.",
    translation: "O Allah, I ask You for Your bounty.",
    reference: "Sahih Muslim — Hadith 713"
  },
  {
    id: "travel-1",
    categoryId: "travel",
    title: "Travel Dua",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
    transliteration: "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrineen wa inna ila Rabbina lamunqaliboon.",
    translation: "Glory is to Him who has subjected this to us, and surely to our Lord we will return.",
    reference: "Sahih Muslim — Hadith 1342"
  },
  {
    id: "parents-1",
    categoryId: "parents",
    title: "Dua for Parents",
    arabic: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbir hamhuma kama rabbayani sagheera.",
    translation: "My Lord, have mercy upon them as they brought me up when I was small.",
    reference: "Qur'an — Surah Al-Isra 17:24"
  },
  {
    id: "forgiveness-1",
    categoryId: "forgiveness",
    title: "Forgiveness Dua",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah.",
    translation: "I seek forgiveness from Allah.",
    reference: "Sahih Muslim"
  },
  {
    id: "morning-1",
    categoryId: "morning",
    title: "Morning Dua",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna wa bika amsayna, wa bika nahya wa bika namootu, wa ilaykan-nushoor.",
    translation: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.",
    reference: "Sunan at-Tirmidhi — Hadith 3391"
  },
  {
    id: "evening-1",
    categoryId: "evening",
    title: "Evening Dua",
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
    transliteration: "Allahumma bika amsayna wa bika asbahna, wa bika nahya wa bika namootu, wa ilaykal-maseer.",
    translation: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the return.",
    reference: "Sunan at-Tirmidhi — Hadith 3391"
  },
  {
    id: "drinking-before-1",
    categoryId: "drinking-before",
    title: "Before Drinking Water",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah.",
    reference: "Sunan Abi Dawood"
  },
  {
    id: "drinking-after-1",
    categoryId: "drinking-after",
    title: "After Drinking Water",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translation: "All praise is for Allah.",
    reference: "Sahih Muslim"
  },
  {
    id: "protection-1",
    categoryId: "protection",
    title: "Protection Dua",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahil-ladhi la yadurru ma'as-mihi shai'un fil-ardi wa la fis-sama'i, wa Huwas-Sami'ul-'Aleem.",
    translation: "In the Name of Allah with Whose Name there is protection against every kind of harm in the earth or in the heaven, and He is the All-Hearing and All-Knowing.",
    reference: "Sunan Abi Dawood — Hadith 5088"
  },
  {
    id: "stress-1",
    categoryId: "stress",
    title: "Stress & Anxiety",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    transliteration: "Allahumma inni a'oodhu bika minal-hammi wal-hazan.",
    translation: "O Allah, I seek refuge in You from anxiety and sorrow.",
    reference: "Sahih al-Bukhari — Hadith 2893"
  },
  {
    id: "gratitude-1",
    categoryId: "gratitude",
    title: "Gratitude Dua",
    arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ",
    transliteration: "Rabbi awzi'nee an ashkura ni'matakal-latee an'amta 'alayya.",
    translation: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
    reference: "Qur'an — Surah An-Naml 27:19"
  },
  {
    id: "sick-1",
    categoryId: "sick",
    title: "Sick Person Dua",
    arabic: "أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ",
    transliteration: "As'alullahal-'Adheema Rabbal-'Arshil-'Adheemi an yashfiyaka.",
    translation: "I ask Allah the Almighty, Lord of the Magnificent Throne, to heal you.",
    reference: "Sunan Abi Dawood — Hadith 3106"
  },
  {
    id: "rain-1",
    categoryId: "rain",
    title: "Rain Dua",
    arabic: "اللَّهُمَّ صَيِّبًا نَافِعًا",
    transliteration: "Allahumma sayyiban nafi'an.",
    translation: "O Allah, (bring) beneficial rain clouds.",
    reference: "Sahih al-Bukhari — Hadith 1032"
  },
  {
    id: "clothes-wear-1",
    categoryId: "clothes-wear",
    title: "Wearing Clothes",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا الثَّوْبَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdulillahil-ladhi kasani hadhath-thawba wa razaqanihi min ghayri hawlin minni wa la quwwah.",
    translation: "All praise is for Allah who has clothed me with this garment and provided it for me without any power or strength from me.",
    reference: "Sunan Abi Dawood — Hadith 4023"
  },
  {
    id: "clothes-remove-1",
    categoryId: "clothes-remove",
    title: "Removing Clothes",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah.",
    reference: "At-Tirmidhi"
  }
];
