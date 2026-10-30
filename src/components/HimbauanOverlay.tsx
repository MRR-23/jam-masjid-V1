import React, { useEffect, useState, useRef } from 'react';
import { HimbauanConfig, ThemeColorKey } from '../types';
import { getThemePalette } from '../utils/themePalettes';
import { soundManager } from '../utils/audioAlerts';
import { X, Smartphone, Users, Sparkles, VolumeX, ShieldAlert } from 'lucide-react';

interface HimbauanOverlayProps {
  himbauan?: HimbauanConfig;
  durationSeconds?: number;
  themeColor?: ThemeColorKey;
  darkMode?: boolean;
  mosqueName?: string;
  prayerName?: string;
  isTestMode?: boolean;
  onComplete: () => void;
}

export const HimbauanOverlay: React.FC<HimbauanOverlayProps> = ({
  himbauan,
  durationSeconds = 60,
  themeColor = 'gold',
  darkMode = true,
  mosqueName,
  prayerName,
  isTestMode = false,
  onComplete
}) => {
  const theme = getThemePalette(themeColor);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const targetEndTimeRef = useRef<number>(Date.now() + durationSeconds * 1000);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);

  // Play a soft chime on entrance to draw congregation's attention to the screen
  useEffect(() => {
    soundManager.playAlarmBeepOnce(0.8, false, 'harmonic_chime');
  }, []);

  useEffect(() => {
    targetEndTimeRef.current = Date.now() + durationSeconds * 1000;
    setSecondsRemaining(durationSeconds);
  }, [durationSeconds]);

  // Keyboard shortcut: Escape only skips during test mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTestMode) {
        onCompleteRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTestMode]);

  // 1-second countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsRemaining(remainingSec);

      if (diffMs <= 0) {
        clearInterval(timer);
        onCompleteRef.current();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 200);
    return () => clearInterval(timer);
  }, [durationSeconds]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const countdownFormatted = `-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const hasCustomImage = typeof himbauan?.imageUrl === 'string' && himbauan.imageUrl.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#05130D] text-slate-100 flex flex-col justify-between items-center select-none overflow-hidden animate-in fade-in duration-300 font-sans">
      
      {/* BACKGROUND AMBIENCE */}
      {hasCustomImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-2xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${himbauan?.imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A261C] via-[#05150F] to-[#020A07] pointer-events-none" />
      )}

      {/* TOP BAR: Mosque Name & Floating Countdown Badge */}
      <div className="relative z-20 w-full px-6 sm:px-12 py-3.5 sm:py-5 flex items-center justify-between bg-black/60 backdrop-blur-md border-b border-[#D4AF37]/30 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#E5C158] to-[#B89228] text-[#071C14] flex items-center justify-center font-extrabold text-base sm:text-lg shadow-md">
            ۞
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-widest text-[#FAF6EE] uppercase drop-shadow">
              {mosqueName || 'MASJID JAMI AL-MUJAHIDIN'}
            </h2>
            <div className="text-[10px] sm:text-xs text-[#E5C158] font-bold flex items-center gap-1.5">
              <span>HIMBAUAN PERSIAPAN SHAF SHOLAT {prayerName ? prayerName.toUpperCase() : 'BERJAMAAH'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-ping" />
            </div>
          </div>
        </div>

        {/* Countdown Timer Pill */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#071C14]/90 border-2 border-[#D4AF37]/60 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-[#EBDDC3] uppercase tracking-wider hidden sm:inline">
              Mulai Sholat Dalam:
            </span>
            <span className="font-mono text-base sm:text-xl font-black text-[#E5C158] tabular-nums">
              {countdownFormatted}
            </span>
          </div>

          {/* Tombol Lewati: HANYA MUNCUL DI MODE PERCOBAAN */}
          {isTestMode && (
            <button
              onClick={onComplete}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Lewati (Mode Percobaan)"
            >
              <span>Lewati</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT: USER'S UPLOADED FULLSCREEN PHOTO OR ELEGANT ISLAMIC SHAF BANNER */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {hasCustomImage ? (
          // USER UPLOADED FULLSCREEN PHOTO
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={himbauan?.imageUrl}
              alt={himbauan?.title || 'Himbauan Shaf Sholat'}
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-2xl sm:rounded-3xl shadow-[0_15px_60px_rgba(0,0,0,0.8)] border border-[#D4AF37]/40 animate-in zoom-in-95 duration-500"
            />
          </div>
        ) : (
          // DEFAULT ELEGANT ISLAMIC SHAF & ADVISORY BANNER
          <div className="w-full max-w-5xl bg-gradient-to-b from-[#0B2E21]/90 to-[#061C14]/95 border-2 border-[#D4AF37]/60 rounded-3xl p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] backdrop-blur-md flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-500">
            {/* Arabic Hadits */}
            <div className="space-y-2">
              <span className="font-['Amiri',serif] text-3xl sm:text-5xl lg:text-6xl font-bold text-[#E5C158] leading-relaxed drop-shadow-md" dir="rtl">
                سَوُّوا صُفُوفَكُمْ فَإِنَّ تَسْوِيَةَ الصَّفِّ مِنْ تَمَامِ الصَّلَاةِ
              </span>
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base lg:text-lg font-semibold text-slate-200 italic max-w-3xl mx-auto">
                "Luruskanlah shaf-shaf kalian, karena sesungguhnya meluruskan shaf merupakan bagian dari kesempurnaan sholat."
              </p>
              <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                — Hadits Riwayat Bukhari & Muslim —
              </div>
            </div>

            {/* Ornamental Divider */}
            <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent my-1" />

            {/* 4 Infographic Cards for Jamaah */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full pt-1">
              {/* Card 1: Rapatkan Shaf */}
              <div className="bg-[#071C14]/90 p-4 rounded-2xl border border-[#D4AF37]/30 flex flex-col items-center text-center shadow-md">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5C158] to-[#B89228] text-[#071C14] flex items-center justify-center font-bold mb-2 shadow">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-[#FAF6EE] uppercase tracking-wide">
                  Rapatkan & Luruskan
                </h3>
                <p className="text-[11px] sm:text-xs text-[#D8CCA9] mt-1 leading-snug">
                  Bahu bersentuhan dengan bahu, tumit lurus sejajar dengan garis tanda shaf masjid.
                </p>
              </div>

              {/* Card 2: Heningkan Handphone */}
              <div className="bg-[#071C14]/90 p-4 rounded-2xl border border-rose-500/40 flex flex-col items-center text-center shadow-md">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center font-bold mb-2 shadow">
                  <VolumeX className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-rose-200 uppercase tracking-wide">
                  Nonaktifkan Nada Dering
                </h3>
                <p className="text-[11px] sm:text-xs text-rose-100/90 mt-1 leading-snug">
                  Mohon matikan atau heningkan nada dering handphone demi kekhusyukan seluruh jamaah.
                </p>
              </div>

              {/* Card 3: Khusyu' Menghadap Allah */}
              <div className="bg-[#071C14]/90 p-4 rounded-2xl border border-[#D4AF37]/30 flex flex-col items-center text-center shadow-md sm:col-span-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#15803D] text-white flex items-center justify-center font-bold mb-2 shadow">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-[#FAF6EE] uppercase tracking-wide">
                  Khusyuk Menghadap Allah
                </h3>
                <p className="text-[11px] sm:text-xs text-[#D8CCA9] mt-1 leading-snug">
                  Ikhlaskan niat dan tenangkan hati menghadap Allah Subhanahu wa Ta'ala.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM FOOTER: Running Text / Guidance Note */}
      <div className="relative z-20 w-full px-6 py-2.5 bg-black/70 backdrop-blur-md border-t border-[#D4AF37]/25 flex items-center justify-center text-center">
        <p className="text-xs sm:text-sm font-semibold text-[#EBDDC3] tracking-wide">
          ★ {himbauan?.subtitle || "Mohon merapatkan shaf dan mengisi shaf terdepan yang masih kosong terlebih dahulu. Sholat akan segera dimulai."} ★
        </p>
      </div>

    </div>
  );
};
