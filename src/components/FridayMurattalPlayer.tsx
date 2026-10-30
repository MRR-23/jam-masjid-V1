import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MosqueConfig, MurattalProgress } from '../types';
import { 
  POPULAR_SURAHS, 
  JUZ_LIST, 
  ALL_SURAHS,
  getSurahInfo, 
  getNextSurah, 
  getPrevSurah, 
  getJuzForSurah, 
  getSurahAudioUrl 
} from '../utils/quranData';
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface FridayMurattalPlayerProps {
  currentTime: Date;
  dzuhurTimeStr: string;
  config: MosqueConfig;
  progress?: MurattalProgress;
  onProgressUpdate?: (progress: MurattalProgress) => void;
}

export const FridayMurattalPlayer: React.FC<FridayMurattalPlayerProps> = ({
  currentTime,
  dzuhurTimeStr,
  config,
  progress: externalProgress,
  onProgressUpdate
}) => {
  const [progress, setProgress] = useState<MurattalProgress>(() => {
    if (externalProgress) return externalProgress;
    return {
      currentJuz: 18,
      currentSurah: 18,
      currentSurahName: 'Al-Kahf',
      currentAyah: 1,
      totalAyahs: 110,
      playbackSeconds: 0,
      durationSeconds: 1800,
      isPlaying: false,
      isTestMode: false,
      fastSimMode: false,
      lastUpdated: new Date().toISOString()
    };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAutoPlayingRef = useRef<boolean>(false);

  // Sync external progress if changed
  useEffect(() => {
    if (externalProgress) {
      setProgress(prev => ({
        ...prev,
        ...externalProgress
      }));
    }
  }, [externalProgress]);

  // Sync with Firestore in real-time
  useEffect(() => {
    const progressDocRef = doc(db, 'murattal_progress', 'current');
    const unsubscribe = onSnapshot(progressDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as MurattalProgress;
        setProgress((prev) => ({
          ...prev,
          ...data
        }));
      }
    }, (error) => {
      console.warn("Firestore murattal listener notice:", error?.message);
    });

    return () => unsubscribe();
  }, []);

  // Save progress to Cloud Firebase
  const saveProgressToCloud = useCallback(async (newProgress: Partial<MurattalProgress>) => {
    try {
      const updated: MurattalProgress = {
        ...progress,
        ...newProgress,
        lastUpdated: new Date().toISOString()
      };
      setProgress(updated);
      onProgressUpdate?.(updated);
      
      const progressDocRef = doc(db, 'murattal_progress', 'current');
      await setDoc(progressDocRef, updated, { merge: true });
    } catch (e) {
      console.warn("Failed to sync murattal to cloud:", e);
    }
  }, [progress, onProgressUpdate]);

  // Audio volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, config.audioVolume ?? 0.85));
    }
  }, [config.audioVolume]);

  // Audio playback controller effect
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (progress.isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay audio blocked or pending user interaction:", err?.message);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [progress.isPlaying, progress.currentSurah]);

  // Check Friday Pre-Dzuhur automatic trigger (60m to 15m before Dzuhur)
  useEffect(() => {
    if (!config.fridayMurattalEnabled) return;
    if (progress.isTestMode) return; // Do not interrupt manual test mode

    const isFriday = currentTime.getDay() === 5; // Friday
    const [h, m] = (dzuhurTimeStr || "12:00").split(':').map(Number);
    const dzuhurDate = new Date(currentTime);
    dzuhurDate.setHours(h, m, 0, 0);

    const diffMinutes = (dzuhurDate.getTime() - currentTime.getTime()) / (60 * 1000);

    const startMinutes = config.fridayMurattalStartMinutesBeforeDzuhur || 60;
    const stopMinutes = config.fridayMurattalStopMinutesBeforeDzuhur || 15;

    const shouldAutoPlay = isFriday && diffMinutes <= startMinutes && diffMinutes >= stopMinutes;

    if (shouldAutoPlay && !progress.isPlaying && !isAutoPlayingRef.current) {
      isAutoPlayingRef.current = true;
      saveProgressToCloud({ isPlaying: true });
    } else if (isFriday && diffMinutes < stopMinutes && progress.isPlaying && isAutoPlayingRef.current) {
      // Reached 15 minutes before Friday Dzuhur - stop automatically
      isAutoPlayingRef.current = false;
      saveProgressToCloud({ isPlaying: false });
    }
  }, [
    currentTime,
    dzuhurTimeStr,
    config.fridayMurattalEnabled,
    config.fridayMurattalStartMinutesBeforeDzuhur,
    config.fridayMurattalStopMinutesBeforeDzuhur,
    progress.isPlaying,
    progress.isTestMode,
    saveProgressToCloud
  ]);

  // Rotation actions: Next Surah & Previous Surah
  const advanceToNextSurah = useCallback(() => {
    const nextSurah = getNextSurah(progress.currentSurah);
    const nextJuz = getJuzForSurah(nextSurah.number);
    const updated: Partial<MurattalProgress> = {
      currentSurah: nextSurah.number,
      currentSurahName: nextSurah.name,
      currentJuz: nextJuz,
      currentAyah: 1,
      totalAyahs: nextSurah.numberOfAyahs,
      playbackSeconds: 0
    };
    saveProgressToCloud(updated);
  }, [progress.currentSurah, saveProgressToCloud]);

  const advanceToPrevSurah = useCallback(() => {
    const prevSurah = getPrevSurah(progress.currentSurah);
    const prevJuz = getJuzForSurah(prevSurah.number);
    const updated: Partial<MurattalProgress> = {
      currentSurah: prevSurah.number,
      currentSurahName: prevSurah.name,
      currentJuz: prevJuz,
      currentAyah: 1,
      totalAyahs: prevSurah.numberOfAyahs,
      playbackSeconds: 0
    };
    saveProgressToCloud(updated);
  }, [progress.currentSurah, saveProgressToCloud]);

  // Fast Simulation Mode: Every 10 seconds rotates to next surah automatically
  useEffect(() => {
    if (!progress.isPlaying || !progress.fastSimMode) return;
    
    const interval = setInterval(() => {
      advanceToNextSurah();
    }, 10000);

    return () => clearInterval(interval);
  }, [progress.isPlaying, progress.fastSimMode, advanceToNextSurah]);

  // Audio time update event
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = Math.floor(audioRef.current.currentTime);
      const dur = Math.floor(audioRef.current.duration) || 1800;
      
      const surahTotalAyahs = progress.totalAyahs || 110;
      const calculatedAyah = Math.min(surahTotalAyahs, Math.max(1, Math.floor((cur / Math.max(1, dur)) * surahTotalAyahs) + 1));
      
      saveProgressToCloud({
        currentAyah: calculatedAyah,
        playbackSeconds: cur,
        durationSeconds: dur
      });
    }
  };

  const handleEnded = () => {
    advanceToNextSurah();
  };

  const togglePlay = () => {
    const willPlay = !progress.isPlaying;
    saveProgressToCloud({ isPlaying: willPlay });
  };

  const stopTestMode = () => {
    saveProgressToCloud({
      isPlaying: false,
      isTestMode: false,
      fastSimMode: false
    });
  };

  const currentAudioUrl = getSurahAudioUrl(progress.currentSurah, config.selectedQari || 'alafasy');

  return (
    <>
      {/* Hidden audio element with live source */}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => {
          console.warn("Audio source loading notice for URL:", currentAudioUrl);
        }}
        preload="auto"
      />

      {/* Murattal floating mini-status widget on bottom-left of TV (clean, no push reminder popup) */}
      {(progress.isPlaying || progress.isTestMode) && (
        <div className="fixed bottom-24 left-6 z-30 bg-[#071C14]/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl border-2 border-[#D4AF37]/50 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center space-x-3.5 animate-in slide-in-from-left duration-300 select-none">
          {/* Animated audio pulse indicator */}
          <div className="flex items-center space-x-1">
            <span className={`w-1 h-3 rounded-full bg-[#D4AF37] ${progress.isPlaying ? 'animate-pulse' : 'opacity-40'}`} />
            <span className={`w-1 h-5 rounded-full bg-[#E5C158] ${progress.isPlaying ? 'animate-pulse' : 'opacity-40'}`} style={{ animationDelay: '150ms' }} />
            <span className={`w-1 h-2.5 rounded-full bg-[#D4AF37] ${progress.isPlaying ? 'animate-pulse' : 'opacity-40'}`} style={{ animationDelay: '300ms' }} />
          </div>

          <div className="flex flex-col min-w-[200px]">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                progress.isTestMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {progress.isTestMode ? "★ Mode Uji Coba Putaran" : "Murattal Jum'at Otomatis"}
              </span>
              {progress.fastSimMode && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ⚡ 10s Rotasi
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-[#FAF6EE] mt-0.5">
              Juz {progress.currentJuz} • Surah {progress.currentSurahName} (Ayat {progress.currentAyah}/{progress.totalAyahs})
            </span>
          </div>

          {/* Quick TV rotation controls: Prev, Play/Pause, Next */}
          <div className="flex items-center space-x-1 pl-2 border-l border-[#D4AF37]/30">
            <button
              onClick={advanceToPrevSurah}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#EBDDC3] hover:text-[#FAF6EE] transition-colors cursor-pointer"
              title="Surah Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-1.5 bg-gradient-to-r from-[#E5C158] to-[#D4AF37] hover:brightness-110 text-[#071C14] rounded-lg transition-all cursor-pointer shadow-md font-bold"
              title={progress.isPlaying ? "Jeda Murattal" : "Putar Murattal"}
            >
              {progress.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={advanceToNextSurah}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#EBDDC3] hover:text-[#FAF6EE] transition-colors cursor-pointer"
              title="Surah Berikutnya (Uji Rotasi)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {progress.isTestMode && (
              <button
                onClick={stopTestMode}
                className="p-1.5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 rounded-lg transition-colors cursor-pointer ml-1"
                title="Tutup Mode Uji Coba"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
