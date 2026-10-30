import React, { useEffect, useState, useRef, useMemo } from 'react';
import { soundManager } from '../utils/audioAlerts';
import { BellOff, X, Sparkles, AlertCircle } from 'lucide-react';
import { ThemeColorKey, BarStyleKey, PrayerKey, AlarmToneKey } from '../types';
import { IslamicPlaque, IslamicPlaqueDivider } from './IslamicPlaque';
import { getThemePalette } from '../utils/themePalettes';

interface SunnahHadithItem {
  id: string;
  category: string;
  arabic: string;
  translation: string;
  narrator: string;
  keutamaan: string;
  prayerMatch?: string[];
}

const HADITHS_SHOLAT_SUNNAH: SunnahHadithItem[] = [
  {
    id: 'fajar',
    category: 'Shalat Sunnah Fajar',
    arabic: 'رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا',
    translation: '“Dua rakaat fajar (sebelum Subuh) itu lebih baik daripada dunia beserta seluruh isinya.”',
    narrator: 'HR. Muslim',
    keutamaan: 'Pahala mulia yang melampaui seluruh kemewahan duniawi.',
    prayerMatch: ['subuh']
  },
  {
    id: 'doa_mustajab',
    category: 'Doa Antara Adzan & Iqamah',
    arabic: 'الدُّعَاءُ لَا يُرَدُّ بَيْنَ الأَذَانِ وَالإِقَامَةِ',
    translation: '“Doa di antara adzan dan iqamah tidak akan ditolak (pasti dikabulkan), maka berdoalah.”',
    narrator: 'HR. Tirmidzi & Abu Dawud',
    keutamaan: 'Waktu mustajab memanjatkan hajat dan keselamatan keluarga.',
    prayerMatch: ['dzuhur', 'ashar', 'magrib', 'isya', 'subuh']
  },
  {
    id: 'antara_adzan_iqamah',
    category: 'Shalat Sunnah Qabliyah',
    arabic: 'بَيْنَ كُلِّ أَذَانَيْنِ صَلَاةٌ لِمَنْ شَاءَ',
    translation: '“Di antara setiap dua adzan (antara adzan dan iqamah) terdapat shalat sunnah bagi yang menghendaki.”',
    narrator: 'HR. Bukhari & Muslim',
    keutamaan: 'Menghidupkan sunnah Rasulullah SAW sebelum shalat fardhu.',
    prayerMatch: ['dzuhur', 'ashar', 'magrib', 'isya', 'subuh']
  },
  {
    id: 'rawatib_12',
    category: '12 Rakaat Rawatib',
    arabic: 'مَنْ صَلَّى ثِنْتَيْ عَشْرَةَ رَكْعَةً فِي يَوْمٍ وَلَيْلَةٍ بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ',
    translation: '“Barangsiapa istiqamah mengerjakan 12 rakaat shalat sunnah sehari semalam, dibangunkan baginya rumah di surga.”',
    narrator: 'HR. Muslim',
    keutamaan: 'Jaminan istana indah di surga Allah SWT.',
    prayerMatch: ['dzuhur', 'magrib', 'isya', 'subuh']
  },
  {
    id: 'tahiyyatul_masjid',
    category: 'Tahiyyatul Masjid',
    arabic: 'إِذَا دَخَلَ أَحَدُكُمُ الْمَسْجِدَ فَلَا يَجْلِسْ حَتَّى يُصَلِّيَ رَكْعَتَيْنِ',
    translation: '“Jika salah seorang di antara kalian memasuki masjid, janganlah duduk sampai shalat dua rakaat.”',
    narrator: 'HR. Bukhari & Muslim',
    keutamaan: 'Penghormatan dan memuliakan rumah ibadah Allah SWT.',
    prayerMatch: ['dzuhur', 'ashar', 'magrib', 'isya', 'subuh']
  }
];

interface IqamahOverlayProps {
  prayerName: string;
  prayerKey?: PrayerKey;
  durationMinutes: number;
  themeColor?: ThemeColorKey;
  barStyle?: BarStyleKey;
  darkMode?: boolean;
  mosqueName?: string;
  alarmTone?: AlarmToneKey;
  onComplete: () => void;
  enableSound?: boolean;
  isTestMode?: boolean;
}

export const IqamahOverlay: React.FC<IqamahOverlayProps> = ({
  prayerName,
  prayerKey,
  durationMinutes,
  themeColor = 'gold',
  darkMode = false,
  mosqueName,
  alarmTone = 'nabawi_chime',
  onComplete,
  enableSound = true,
  isTestMode = false
}) => {
  const theme = getThemePalette(themeColor);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [hadithIndex, setHadithIndex] = useState(0);

  // Filter or prioritize hadith based on current prayer
  const pKey = (prayerKey || prayerName?.toLowerCase() || '').trim();
  const prioritizedHadiths = useMemo(() => {
    const matched = HADITHS_SHOLAT_SUNNAH.filter(h => h.prayerMatch && h.prayerMatch.includes(pKey));
    const others = HADITHS_SHOLAT_SUNNAH.filter(h => !h.prayerMatch || !h.prayerMatch.includes(pKey));
    return matched.length > 0 ? [...matched, ...others] : HADITHS_SHOLAT_SUNNAH;
  }, [pKey]);

  // Gentle auto-rotation every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHadithIndex((prev) => (prev + 1) % prioritizedHadiths.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [prioritizedHadiths.length]);

  // Keyboard shortcut: Escape in test mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTestMode) {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete, isTestMode]);

  const targetEndTimeRef = useRef(Date.now() + durationMinutes * 60 * 1000);
  const lastWarningBeepRef = useRef<number | null>(null);

  useEffect(() => {
    targetEndTimeRef.current = Date.now() + durationMinutes * 60 * 1000;
  }, [durationMinutes]);

  useEffect(() => {
    const checkTimer = () => {
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsLeft(remaining);

      // Warning beeps in last 5 seconds (5, 4, 3, 2, 1) using selected alarm tone
      if (remaining <= 5 && remaining >= 1 && enableSound) {
        if (lastWarningBeepRef.current !== remaining) {
          lastWarningBeepRef.current = remaining;
          soundManager.playAlarmBeepOnce(1.0, remaining === 1, alarmTone);
        }
      }

      if (diffMs <= 0) {
        if (enableSound) {
          soundManager.playIqamahArrivalAlert(1.0);
        }
        onComplete();
      }
    };

    const intervalId = setInterval(checkTimer, 200);
    return () => clearInterval(intervalId);
  }, [onComplete, enableSound, alarmTone]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const minStr = minutes.toString().padStart(2, '0');
  const secStr = seconds.toString().padStart(2, '0');
  const countdownFormatted = `-${minStr}:${secStr}`;
  const isLast5Sec = secondsLeft <= 5 && secondsLeft >= 1;

  const currentHadith = prioritizedHadiths[hadithIndex] || HADITHS_SHOLAT_SUNNAH[0];

  return (
    <IslamicPlaque 
      themeColor={themeColor}
      darkMode={darkMode}
      mosqueName={mosqueName}
    >
      {/* Tombol Lewati: HANYA MUNCUL DI MODE PERCOBAAN / TEST MODE */}
      {isTestMode && (
        <button
          onClick={onComplete}
          className={`absolute top-4 right-6 sm:top-6 sm:right-8 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur border shadow-md transition-all active:scale-95 ${
            darkMode 
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
          title="Lewati (Mode Percobaan)"
        >
          <span>Lewati</span>
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 1. TOP COUNTDOWN TIMER: BESAR, TEGAS & JERNIH */}
      <div 
        className={`font-['Plus_Jakarta_Sans',sans-serif] text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9.5rem] font-black tracking-tight leading-none select-none my-1 sm:my-1.5 transition-transform duration-200 ${
          isLast5Sec ? 'scale-105 animate-pulse text-amber-500 drop-shadow-2xl' : 'drop-shadow-md'
        }`}
        style={{
          color: isLast5Sec ? '#f59e0b' : (darkMode ? '#ffffff' : '#0f172a')
        }}
      >
        {countdownFormatted}
      </div>

      {/* 2. ORNAMENTAL GOLDEN DIVIDER —◆— */}
      <IslamicPlaqueDivider themeColor={themeColor} className="my-1.5 sm:my-2 scale-100 sm:scale-110" />

      {/* 3. MAIN TITLE: Menjelang Iqamah Sholat */}
      <div className="flex flex-col items-center my-1 sm:my-1.5">
        <h1 
          className={`font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Menjelang Iqamah <span className="capitalize" style={{ color: theme.primary }}>{prayerName || 'Shalat'}</span>
        </h1>
      </div>

      {/* 4. KARTU HADITS & AJAKAN SHALAT SUNNAH: SIMPLE, BERSIH, & BERWIBAWA */}
      <div 
        className={`w-full max-w-3xl px-6 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border backdrop-blur-md shadow-xl transition-all duration-700 flex flex-col items-center text-center my-1.5 sm:my-2 ${
          darkMode 
            ? 'bg-black/45 border-amber-400/30 text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.6)]' 
            : 'bg-white/85 border-amber-400/40 text-slate-800 shadow-[0_10px_35px_rgba(212,175,55,0.15)]'
        }`}
      >
        {/* Ajakan shalat sunnah & doa */}
        <div className="flex items-center gap-2 mb-1.5 text-xs sm:text-sm font-extrabold text-amber-400 tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>Mari Melaksanakan Shalat Sunnah & Memperbanyak Doa</span>
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        </div>

        {/* Matan Hadits Bahasa Arab */}
        <div 
          className="font-['Amiri',serif] text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed my-1 select-none drop-shadow-sm tracking-wide"
          dir="rtl"
          style={{ color: darkMode ? '#FDE047' : '#92400e' }}
        >
          {currentHadith.arabic}
        </div>

        {/* Terjemahan Bahasa Indonesia */}
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm md:text-base font-semibold italic opacity-90 mt-1 max-w-2xl leading-relaxed">
          {currentHadith.translation}
        </p>

        {/* Perawi & Keutamaan */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-3 text-[11px] sm:text-xs">
          <span className="font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
            {currentHadith.narrator}
          </span>
          <span className="opacity-90 font-medium">
            ★ <span className="font-bold text-amber-300">Keutamaan:</span> {currentHadith.keutamaan}
          </span>
        </div>
      </div>

      {/* 5. BILAH BAWAH: PERINGATAN ALARM (5 DETIK TERAKHIR) ATAU MODE SENYAP PONSEL */}
      {isLast5Sec ? (
        <div 
          className="mt-2 px-6 py-2.5 rounded-full text-white text-xs sm:text-sm md:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 animate-bounce shadow-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border border-amber-300"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>ALARM IQAMAH: SHAF SEGERA DIRAPATKAN ({secondsLeft} DETIK)</span>
        </div>
      ) : (
        <div 
          className={`flex items-center justify-center gap-2 px-5 py-1.5 rounded-full border backdrop-blur-sm mt-1 text-[11px] sm:text-xs font-semibold ${
            darkMode 
              ? 'bg-black/30 border-white/10 text-[#C4B79D]' 
              : 'bg-white/70 border-black/10 text-slate-600'
          }`}
        >
          <BellOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Luruskan shaf sholat & mohon heningkan nada dering handphone.</span>
        </div>
      )}

    </IslamicPlaque>
  );
};



