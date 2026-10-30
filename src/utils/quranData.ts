export interface SurahInfo {
  number: number;
  name: string;
  arabic: string;
  english: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  juz: number;
}

export interface JuzInfo {
  juzNumber: number;
  name: string;
  startSurah: number;
  startSurahName: string;
  startAyah: number;
}

// 30 Juz definitions
export const JUZ_LIST: JuzInfo[] = [
  { juzNumber: 1, name: "Alif Lam Meem", startSurah: 1, startSurahName: "Al-Fatihah", startAyah: 1 },
  { juzNumber: 2, name: "Sayaqool", startSurah: 2, startSurahName: "Al-Baqarah", startAyah: 142 },
  { juzNumber: 3, name: "Tilkal Rusul", startSurah: 2, startSurahName: "Al-Baqarah", startAyah: 253 },
  { juzNumber: 4, name: "Lan Tanaloo", startSurah: 3, startSurahName: "Ali 'Imran", startAyah: 92 },
  { juzNumber: 5, name: "Wal Muhsanat", startSurah: 4, startSurahName: "An-Nisa", startAyah: 24 },
  { juzNumber: 6, name: "La Yuhibbullah", startSurah: 4, startSurahName: "An-Nisa", startAyah: 148 },
  { juzNumber: 7, name: "Wa Iza Sami'oo", startSurah: 5, startSurahName: "Al-Ma'idah", startAyah: 82 },
  { juzNumber: 8, name: "Wa Lau Annana", startSurah: 6, startSurahName: "Al-An'am", startAyah: 111 },
  { juzNumber: 9, name: "Qalal Malao", startSurah: 7, startSurahName: "Al-A'raf", startAyah: 88 },
  { juzNumber: 10, name: "Wa A'lamoo", startSurah: 8, startSurahName: "Al-Anfal", startAyah: 41 },
  { juzNumber: 11, name: "Ya'taziroon", startSurah: 9, startSurahName: "At-Tawbah", startAyah: 93 },
  { juzNumber: 12, name: "Wa Mamin Da'abbah", startSurah: 11, startSurahName: "Hud", startAyah: 6 },
  { juzNumber: 13, name: "Wa Ma Ubarri'u", startSurah: 12, startSurahName: "Yusuf", startAyah: 53 },
  { juzNumber: 14, name: "Rubama", startSurah: 15, startSurahName: "Al-Hijr", startAyah: 1 },
  { juzNumber: 15, name: "Subhanallazi", startSurah: 17, startSurahName: "Al-Isra", startAyah: 1 },
  { juzNumber: 16, name: "Qal Alam", startSurah: 18, startSurahName: "Al-Kahf", startAyah: 75 },
  { juzNumber: 17, name: "Iqtaraba", startSurah: 21, startSurahName: "Al-Anbiya", startAyah: 1 },
  { juzNumber: 18, name: "Qad Aflaha", startSurah: 23, startSurahName: "Al-Mu'minun", startAyah: 1 },
  { juzNumber: 19, name: "Wa Qalal Lazina", startSurah: 25, startSurahName: "Al-Furqan", startAyah: 21 },
  { juzNumber: 20, name: "A'man Khalaqa", startSurah: 27, startSurahName: "An-Naml", startAyah: 56 },
  { juzNumber: 21, name: "Utlu Ma Oohiya", startSurah: 29, startSurahName: "Al-Ankabut", startAyah: 46 },
  { juzNumber: 22, name: "Wa Manyaqnut", startSurah: 33, startSurahName: "Al-Ahzab", startAyah: 31 },
  { juzNumber: 23, name: "Wa Maliya", startSurah: 36, startSurahName: "Ya-Sin", startAyah: 28 },
  { juzNumber: 24, name: "Faman Azlamu", startSurah: 39, startSurahName: "Az-Zumar", startAyah: 32 },
  { juzNumber: 25, name: "Ilaihi Yuraddu", startSurah: 41, startSurahName: "Fussilat", startAyah: 47 },
  { juzNumber: 26, name: "Ha'a Meem", startSurah: 46, startSurahName: "Al-Ahqaf", startAyah: 1 },
  { juzNumber: 27, name: "Qala Fama Khatbukum", startSurah: 51, startSurahName: "Az-Zariyat", startAyah: 31 },
  { juzNumber: 28, name: "Qad Sami'allah", startSurah: 58, startSurahName: "Al-Mujadila", startAyah: 1 },
  { juzNumber: 29, name: "Tabarakallazi", startSurah: 67, startSurahName: "Al-Mulk", startAyah: 1 },
  { juzNumber: 30, name: "Amma Yatasa'aloon (Juz 'Amma)", startSurah: 78, startSurahName: "An-Naba", startAyah: 1 },
];

export const POPULAR_SURAHS: SurahInfo[] = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", english: "Pembuka", numberOfAyahs: 7, revelationType: 'Meccan', juz: 1 },
  { number: 18, name: "Al-Kahf", arabic: "الكهف", english: "Gua", numberOfAyahs: 110, revelationType: 'Meccan', juz: 15 },
  { number: 36, name: "Ya-Sin", arabic: "يس", english: "Ya Sin", numberOfAyahs: 83, revelationType: 'Meccan', juz: 22 },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", english: "Maha Pemurah", numberOfAyahs: 78, revelationType: 'Medinan', juz: 27 },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", english: "Hari Kiamat", numberOfAyahs: 96, revelationType: 'Meccan', juz: 27 },
  { number: 67, name: "Al-Mulk", arabic: "الملك", english: "Kerajaan", numberOfAyahs: 30, revelationType: 'Meccan', juz: 29 },
  { number: 78, name: "An-Naba'", arabic: "النبأ", english: "Berita Besar", numberOfAyahs: 40, revelationType: 'Meccan', juz: 30 },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", english: "Kemurnian Keesaan", numberOfAyahs: 4, revelationType: 'Meccan', juz: 30 },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", english: "Waktu Subuh", numberOfAyahs: 5, revelationType: 'Meccan', juz: 30 },
  { number: 114, name: "An-Nas", arabic: "الناس", english: "Manusia", numberOfAyahs: 6, revelationType: 'Meccan', juz: 30 },
];

// Reciters
export interface Reciter {
  id: string;
  name: string;
  sourceBaseUrl: string;
}

export const QARI_LIST: Reciter[] = [
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', sourceBaseUrl: 'https://server8.mp3quran.net/afs' },
  { id: 'sudais', name: 'Abdur-Rahman As-Sudais', sourceBaseUrl: 'https://server11.mp3quran.net/sds' },
  { id: 'ghamadi', name: 'Saad Al-Ghamdi', sourceBaseUrl: 'https://server7.mp3quran.net/s_gmd' },
  { id: 'ajamy', name: 'Ahmed Al-Ajamy', sourceBaseUrl: 'https://server10.mp3quran.net/ajm' },
];

export const ALL_SURAHS: { number: number; name: string; arabic: string; numberOfAyahs: number; juz: number }[] = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", numberOfAyahs: 7, juz: 1 },
  { number: 2, name: "Al-Baqarah", arabic: "البقرة", numberOfAyahs: 286, juz: 1 },
  { number: 3, name: "Ali 'Imran", arabic: "آل عمران", numberOfAyahs: 200, juz: 3 },
  { number: 4, name: "An-Nisa'", arabic: "النساء", numberOfAyahs: 176, juz: 4 },
  { number: 5, name: "Al-Ma'idah", arabic: "المائدة", numberOfAyahs: 120, juz: 6 },
  { number: 6, name: "Al-An'am", arabic: "الأنعام", numberOfAyahs: 165, juz: 7 },
  { number: 7, name: "Al-A'raf", arabic: "الأعراف", numberOfAyahs: 206, juz: 8 },
  { number: 8, name: "Al-Anfal", arabic: "الأنفال", numberOfAyahs: 75, juz: 9 },
  { number: 9, name: "At-Tawbah", arabic: "التوبة", numberOfAyahs: 129, juz: 10 },
  { number: 10, name: "Yunus", arabic: "يونس", numberOfAyahs: 109, juz: 11 },
  { number: 11, name: "Hud", arabic: "هود", numberOfAyahs: 123, juz: 11 },
  { number: 12, name: "Yusuf", arabic: "يوسف", numberOfAyahs: 111, juz: 12 },
  { number: 13, name: "Ar-Ra'd", arabic: "الرعد", numberOfAyahs: 43, juz: 13 },
  { number: 14, name: "Ibrahim", arabic: "إبراهيم", numberOfAyahs: 52, juz: 13 },
  { number: 15, name: "Al-Hijr", arabic: "الحجر", numberOfAyahs: 99, juz: 14 },
  { number: 16, name: "An-Nahl", arabic: "النحل", numberOfAyahs: 128, juz: 14 },
  { number: 17, name: "Al-Isra'", arabic: "الإسراء", numberOfAyahs: 111, juz: 15 },
  { number: 18, name: "Al-Kahf", arabic: "الكهف", numberOfAyahs: 110, juz: 15 },
  { number: 19, name: "Maryam", arabic: "مريم", numberOfAyahs: 98, juz: 16 },
  { number: 20, name: "Ta-Ha", arabic: "طه", numberOfAyahs: 135, juz: 16 },
  { number: 21, name: "Al-Anbiya'", arabic: "الأنبياء", numberOfAyahs: 112, juz: 17 },
  { number: 22, name: "Al-Hajj", arabic: "الحج", numberOfAyahs: 78, juz: 17 },
  { number: 23, name: "Al-Mu'minun", arabic: "المؤمنون", numberOfAyahs: 118, juz: 18 },
  { number: 24, name: "An-Nur", arabic: "النور", numberOfAyahs: 64, juz: 18 },
  { number: 25, name: "Al-Furqan", arabic: "الفرقان", numberOfAyahs: 77, juz: 18 },
  { number: 26, name: "Asy-Syu'ara'", arabic: "الشعراء", numberOfAyahs: 227, juz: 19 },
  { number: 27, name: "An-Naml", arabic: "النمل", numberOfAyahs: 93, juz: 19 },
  { number: 28, name: "Al-Qashash", arabic: "القصص", numberOfAyahs: 88, juz: 20 },
  { number: 29, name: "Al-'Ankabut", arabic: "العنكبوت", numberOfAyahs: 69, juz: 20 },
  { number: 30, name: "Ar-Rum", arabic: "الروم", numberOfAyahs: 60, juz: 21 },
  { number: 31, name: "Luqman", arabic: "لقمان", numberOfAyahs: 34, juz: 21 },
  { number: 32, name: "As-Sajdah", arabic: "السجدة", numberOfAyahs: 30, juz: 21 },
  { number: 33, name: "Al-Ahzab", arabic: "الأحزاب", numberOfAyahs: 73, juz: 21 },
  { number: 34, name: "Saba'", arabic: "سبأ", numberOfAyahs: 54, juz: 22 },
  { number: 35, name: "Fathir", arabic: "فاطر", numberOfAyahs: 45, juz: 22 },
  { number: 36, name: "Ya-Sin", arabic: "يس", numberOfAyahs: 83, juz: 22 },
  { number: 37, name: "Ash-Shaffat", arabic: "الصافات", numberOfAyahs: 182, juz: 23 },
  { number: 38, name: "Shad", arabic: "ص", numberOfAyahs: 88, juz: 23 },
  { number: 39, name: "Az-Zumar", arabic: "الزمر", numberOfAyahs: 75, juz: 23 },
  { number: 40, name: "Ghafir", arabic: "غافر", numberOfAyahs: 85, juz: 24 },
  { number: 41, name: "Fushshilat", arabic: "فصلت", numberOfAyahs: 54, juz: 24 },
  { number: 42, name: "Asy-Syura", arabic: "الشورى", numberOfAyahs: 53, juz: 25 },
  { number: 43, name: "Az-Zukhruf", arabic: "الزخرف", numberOfAyahs: 89, juz: 25 },
  { number: 44, name: "Ad-Dukhan", arabic: "الدخان", numberOfAyahs: 59, juz: 25 },
  { number: 45, name: "Al-Jatsiyah", arabic: "الجاثية", numberOfAyahs: 37, juz: 25 },
  { number: 46, name: "Al-Ahqaf", arabic: "الأحقاف", numberOfAyahs: 35, juz: 26 },
  { number: 47, name: "Muhammad", arabic: "محمد", numberOfAyahs: 38, juz: 26 },
  { number: 48, name: "Al-Fath", arabic: "الفتح", numberOfAyahs: 29, juz: 26 },
  { number: 49, name: "Al-Hujurat", arabic: "الحجرات", numberOfAyahs: 18, juz: 26 },
  { number: 50, name: "Qaf", arabic: "ق", numberOfAyahs: 45, juz: 26 },
  { number: 51, name: "Adz-Dzariyat", arabic: "الذاريات", numberOfAyahs: 60, juz: 26 },
  { number: 52, name: "Ath-Thur", arabic: "الطور", numberOfAyahs: 49, juz: 27 },
  { number: 53, name: "An-Najm", arabic: "النجم", numberOfAyahs: 62, juz: 27 },
  { number: 54, name: "Al-Qamar", arabic: "القمر", numberOfAyahs: 55, juz: 27 },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", numberOfAyahs: 78, juz: 27 },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", numberOfAyahs: 96, juz: 27 },
  { number: 57, name: "Al-Hadid", arabic: "الحديد", numberOfAyahs: 29, juz: 27 },
  { number: 58, name: "Al-Mujadilah", arabic: "المجادلة", numberOfAyahs: 22, juz: 28 },
  { number: 59, name: "Al-Hasyr", arabic: "الحشر", numberOfAyahs: 24, juz: 28 },
  { number: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", numberOfAyahs: 13, juz: 28 },
  { number: 61, name: "Ash-Shaff", arabic: "الصف", numberOfAyahs: 14, juz: 28 },
  { number: 62, name: "Al-Jumu'ah", arabic: "الجمعة", numberOfAyahs: 11, juz: 28 },
  { number: 63, name: "Al-Munafiqun", arabic: "المنافقون", numberOfAyahs: 11, juz: 28 },
  { number: 64, name: "At-Taghabun", arabic: "التغابن", numberOfAyahs: 18, juz: 28 },
  { number: 65, name: "Ath-Thalaq", arabic: "الطلاق", numberOfAyahs: 12, juz: 28 },
  { number: 66, name: "At-Tahrim", arabic: "التحريم", numberOfAyahs: 12, juz: 28 },
  { number: 67, name: "Al-Mulk", arabic: "الملك", numberOfAyahs: 30, juz: 29 },
  { number: 68, name: "Al-Qalam", arabic: "القلم", numberOfAyahs: 52, juz: 29 },
  { number: 69, name: "Al-Haqqah", arabic: "الحاقة", numberOfAyahs: 52, juz: 29 },
  { number: 70, name: "Al-Ma'arij", arabic: "المعارج", numberOfAyahs: 44, juz: 29 },
  { number: 71, name: "Nuh", arabic: "نوح", numberOfAyahs: 28, juz: 29 },
  { number: 72, name: "Al-Jinn", arabic: "الجن", numberOfAyahs: 28, juz: 29 },
  { number: 73, name: "Al-Muzzammil", arabic: "المزمل", numberOfAyahs: 20, juz: 29 },
  { number: 74, name: "Al-Muddatstsir", arabic: "المدثر", numberOfAyahs: 56, juz: 29 },
  { number: 75, name: "Al-Qiyamah", arabic: "القيامة", numberOfAyahs: 40, juz: 29 },
  { number: 76, name: "Al-Insan", arabic: "الإنسان", numberOfAyahs: 31, juz: 29 },
  { number: 77, name: "Al-Mursalat", arabic: "المرسلات", numberOfAyahs: 50, juz: 29 },
  { number: 78, name: "An-Naba'", arabic: "النبأ", numberOfAyahs: 40, juz: 30 },
  { number: 79, name: "An-Nazi'at", arabic: "النازعات", numberOfAyahs: 46, juz: 30 },
  { number: 80, name: "'Abasa", arabic: "عبس", numberOfAyahs: 42, juz: 30 },
  { number: 81, name: "At-Takwir", arabic: "التكوير", numberOfAyahs: 29, juz: 30 },
  { number: 82, name: "Al-Infithar", arabic: "الانفطار", numberOfAyahs: 19, juz: 30 },
  { number: 83, name: "Al-Muthaffifin", arabic: "المطففين", numberOfAyahs: 36, juz: 30 },
  { number: 84, name: "Al-Insyiqaq", arabic: "الانشقاق", numberOfAyahs: 25, juz: 30 },
  { number: 85, name: "Al-Buruj", arabic: "البروج", numberOfAyahs: 22, juz: 30 },
  { number: 86, name: "Ath-Thariq", arabic: "الطارق", numberOfAyahs: 17, juz: 30 },
  { number: 87, name: "Al-A'la", arabic: "الأعلى", numberOfAyahs: 19, juz: 30 },
  { number: 88, name: "Al-Ghasyiyah", arabic: "الغاشية", numberOfAyahs: 26, juz: 30 },
  { number: 89, name: "Al-Fajr", arabic: "الفجر", numberOfAyahs: 30, juz: 30 },
  { number: 90, name: "Al-Balad", arabic: "البلد", numberOfAyahs: 20, juz: 30 },
  { number: 91, name: "Asy-Syams", arabic: "الشمس", numberOfAyahs: 15, juz: 30 },
  { number: 92, name: "Al-Lail", arabic: "الليل", numberOfAyahs: 21, juz: 30 },
  { number: 93, name: "Adh-Dhuha", arabic: "الضحى", numberOfAyahs: 11, juz: 30 },
  { number: 94, name: "Asy-Syarh", arabic: "الشرح", numberOfAyahs: 8, juz: 30 },
  { number: 95, name: "At-Tin", arabic: "التين", numberOfAyahs: 8, juz: 30 },
  { number: 96, name: "Al-'Alaq", arabic: "العلق", numberOfAyahs: 19, juz: 30 },
  { number: 97, name: "Al-Qadr", arabic: "القدر", numberOfAyahs: 5, juz: 30 },
  { number: 98, name: "Al-Bayyinah", arabic: "البينة", numberOfAyahs: 8, juz: 30 },
  { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", numberOfAyahs: 8, juz: 30 },
  { number: 100, name: "Al-'Adiyat", arabic: "العاديات", numberOfAyahs: 11, juz: 30 },
  { number: 101, name: "Al-Qari'ah", arabic: "القارعة", numberOfAyahs: 11, juz: 30 },
  { number: 102, name: "At-Takatsur", arabic: "التكاثر", numberOfAyahs: 8, juz: 30 },
  { number: 103, name: "Al-'Ashr", arabic: "العصر", numberOfAyahs: 3, juz: 30 },
  { number: 104, name: "Al-Humazah", arabic: "الهمزة", numberOfAyahs: 9, juz: 30 },
  { number: 105, name: "Al-Fil", arabic: "الفيل", numberOfAyahs: 5, juz: 30 },
  { number: 106, name: "Quraisy", arabic: "قريش", numberOfAyahs: 4, juz: 30 },
  { number: 107, name: "Al-Ma'un", arabic: "الماعون", numberOfAyahs: 7, juz: 30 },
  { number: 108, name: "Al-Kautsar", arabic: "الكوثر", numberOfAyahs: 3, juz: 30 },
  { number: 109, name: "Al-Kafirun", arabic: "الكافرون", numberOfAyahs: 6, juz: 30 },
  { number: 110, name: "An-Nashr", arabic: "النصر", numberOfAyahs: 3, juz: 30 },
  { number: 111, name: "Al-Lahab", arabic: "اللهب", numberOfAyahs: 5, juz: 30 },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", numberOfAyahs: 4, juz: 30 },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", numberOfAyahs: 5, juz: 30 },
  { number: 114, name: "An-Nas", arabic: "الناس", numberOfAyahs: 6, juz: 30 },
];

export function getSurahInfo(surahNumber: number) {
  const found = ALL_SURAHS.find(s => s.number === surahNumber);
  if (found) return found;
  return {
    number: surahNumber,
    name: `Surah ${surahNumber}`,
    arabic: '',
    numberOfAyahs: 100,
    juz: 1
  };
}

export function getNextSurah(currentSurah: number) {
  const nextNum = currentSurah >= 114 ? 1 : currentSurah + 1;
  return getSurahInfo(nextNum);
}

export function getPrevSurah(currentSurah: number) {
  const prevNum = currentSurah <= 1 ? 114 : currentSurah - 1;
  return getSurahInfo(prevNum);
}

export function getJuzForSurah(surahNumber: number): number {
  const surah = getSurahInfo(surahNumber);
  return surah.juz;
}

export function getSurahAudioUrl(surahNumber: number, reciterId: string = 'alafasy'): string {
  const padded = surahNumber.toString().padStart(3, '0');
  const reciter = QARI_LIST.find(q => q.id === reciterId) || QARI_LIST[0];
  return `${reciter.sourceBaseUrl}/${padded}.mp3`;
}

// Single Ayah audio from everyayah CDN (for per-ayah playback)
export function getAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  const ayahPadded = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`;
}

