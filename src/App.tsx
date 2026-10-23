/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Watch, 
  Vibrate, 
  HelpCircle,
  Activity,
  Sliders,
  Download
} from 'lucide-react';
import { HapticConfig, HapticIntensity, SoundType, TimeSignature } from './types/metronome';
import { TIME_SIGNATURE_PRESETS } from './data/exercisePresets';
import { audioEngine } from './services/audioEngine';
import { hapticsService } from './services/haptics';
import { mediaSessionManager } from './services/mediaSession';
import { ThreeMainButtons } from './components/ThreeMainButtons';
import { GalaxyFit3Simulator } from './components/GalaxyFit3Simulator';
import { TempoModal } from './components/TempoModal';
import { TimeSignatureModal } from './components/TimeSignatureModal';
import { HapticSettingsModal } from './components/HapticSettingsModal';
import { Fit3PairingGuideModal } from './components/Fit3PairingGuideModal';
import { ApkInstallBanner } from './components/ApkInstallBanner';
import { ApkInstallerModal } from './components/ApkInstallerModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function App() {
  // Metronome State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(160); // 160 BPM standard running cadence
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(TIME_SIGNATURE_PRESETS[0]);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [soundType, setSoundType] = useState<SoundType>('woodblock');
  const [volume, setVolume] = useState<number>(0.85);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Haptic Configuration for Exercise & Samsung Galaxy Fit 3
  const [hapticConfig, setHapticConfig] = useState<HapticConfig>({
    intensity: 'high',
    accentFirstBeat: true,
    vibrateOnPhone: true,
    vibrateOnFit3: true,
    durationMs: 85,
    accentDurationMs: 120,
  });

  // Active view toggle on mobile: 'metronome' | 'fit3' | 'both'
  const [mobileTab, setMobileTab] = useState<'metronome' | 'fit3'>('metronome');

  // Modals state
  const [isTempoModalOpen, setIsTempoModalOpen] = useState(false);
  const [isTimeSignatureModalOpen, setIsTimeSignatureModalOpen] = useState(false);
  const [isHapticModalOpen, setIsHapticModalOpen] = useState(false);
  const [isFit3GuideOpen, setIsFit3GuideOpen] = useState(false);
  const [isApkInstallerOpen, setIsApkInstallerOpen] = useState(false);

  // PWA / APK installation lifecycle
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsApkInstallerOpen(false);
      }
      setDeferredPrompt(null);
    } else {
      setIsApkInstallerOpen(true);
    }
  };

  // Synchronize audio engine callback with UI beat indicator & haptics
  useEffect(() => {
    audioEngine.setBeatCallback((beatNumber) => {
      setCurrentBeat(beatNumber);
      hapticsService.triggerHaptic(beatNumber, hapticConfig);
      mediaSessionManager.update(bpm, timeSignature.beats, beatNumber, true);
    });
  }, [bpm, timeSignature.beats, hapticConfig]);

  // Handle Play/Stop Toggle
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      mediaSessionManager.update(bpm, timeSignature.beats, currentBeat, false);
    } else {
      audioEngine.start(bpm, timeSignature.beats, soundType, volume, soundEnabled);
      setIsPlaying(true);
      mediaSessionManager.update(bpm, timeSignature.beats, 0, true);
      // Immediate tactile touch confirmation
      hapticsService.testHaptic('low');
    }
  }, [isPlaying, bpm, timeSignature.beats, soundType, volume, soundEnabled, currentBeat]);

  // Adjust BPM
  const handleAdjustBpm = useCallback((delta: number) => {
    setBpm((prev) => {
      const next = Math.max(30, Math.min(260, prev + delta));
      audioEngine.setParams(next, timeSignature.beats, soundType, volume, soundEnabled);
      mediaSessionManager.update(next, timeSignature.beats, currentBeat, isPlaying);
      return next;
    });
  }, [timeSignature.beats, soundType, volume, soundEnabled, currentBeat, isPlaying]);

  const handleSetBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(30, Math.min(260, newBpm));
    setBpm(clamped);
    audioEngine.setParams(clamped, timeSignature.beats, soundType, volume, soundEnabled);
    mediaSessionManager.update(clamped, timeSignature.beats, currentBeat, isPlaying);
  }, [timeSignature.beats, soundType, volume, soundEnabled, currentBeat, isPlaying]);

  // MediaSession setup for Samsung Galaxy Wearable and Fit 3 Media Tile
  useEffect(() => {
    mediaSessionManager.setup({
      onPlay: () => {
        if (!isPlaying) handleTogglePlay();
      },
      onPause: () => {
        if (isPlaying) handleTogglePlay();
      },
      onNextTrack: () => {
        handleAdjustBpm(5);
      },
      onPreviousTrack: () => {
        handleAdjustBpm(-5);
      },
    });
  }, [isPlaying, handleTogglePlay, handleAdjustBpm]);

  // Sound toggle
  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioEngine.setParams(bpm, timeSignature.beats, soundType, volume, next);
      return next;
    });
  };

  // Time signature change
  const handleSelectTimeSignature = (ts: TimeSignature) => {
    setTimeSignature(ts);
    audioEngine.setParams(bpm, ts.beats, soundType, volume, soundEnabled);
    mediaSessionManager.update(bpm, ts.beats, 0, isPlaying);
  };

  // Sound type change
  const handleSelectSoundType = (type: SoundType) => {
    setSoundType(type);
    audioEngine.setParams(bpm, timeSignature.beats, type, volume, soundEnabled);
  };

  // Volume change
  const handleChangeVolume = (vol: number) => {
    setVolume(vol);
    audioEngine.setParams(bpm, timeSignature.beats, soundType, vol, soundEnabled);
  };

  // Haptic intensity change
  const handleUpdateHapticIntensity = (intensity: HapticIntensity) => {
    setHapticConfig((prev) => ({
      ...prev,
      intensity,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar following Top Bar Contract (3 zones separated by gap-8) */}
      <header className="flex items-center justify-between gap-8 px-5 py-3.5 border-b border-slate-850/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-sky-500 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <span>PulseFit</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button 
            type="button"
            onClick={() => setMobileTab('metronome')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Metrónomo
          </button>
          <button 
            type="button"
            onClick={() => setMobileTab('fit3')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tarjeta Galaxy Fit 3
          </button>
          <button 
            type="button"
            onClick={() => setIsHapticModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Intensidad Háptica
          </button>
          <button 
            type="button"
            onClick={() => setIsTempoModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cadencias Deportivas
          </button>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsApkInstallerOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-emerald-500/20 active:scale-95"
            title="Instalar como APK en tu móvil"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar APK</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFit3GuideOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Guía Fit 3</span>
            <span className="sm:hidden">Guía</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* PWA / APK Install Banner for Android workouts */}
        <ApkInstallBanner
          onOpenInstallerModal={() => setIsApkInstallerOpen(true)}
          deferredPrompt={deferredPrompt}
          onTriggerInstall={handleTriggerInstall}
          isInstalled={isInstalled}
        />

        {/* Mobile View Switcher (Visible on small screens) */}
        <div className="flex lg:hidden items-center justify-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab('metronome')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mobileTab === 'metronome'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3 Botones Móvil</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('fit3')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mobileTab === 'fit3'
                ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Watch className="w-3.5 h-3.5" />
            <span>Muñeca Galaxy Fit 3</span>
          </button>
        </div>

        {/* Split Grid Layout (Full 1440px desktop balance + responsive mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: The 3 Core Metronome Buttons (Mobile view 1) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-5 ${
              mobileTab === 'fit3' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Context Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Metrónomo Deportivo Háptico
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Los 3 controles principales para mantener tu cadencia constante
                </p>
              </div>

              {/* Quick haptic intensity trigger button */}
              <button
                type="button"
                onClick={() => setIsHapticModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer"
                title="Configurar fuerza de vibración"
              >
                <Vibrate className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Vibración:</span>
                <span className="text-white font-bold capitalize">{hapticConfig.intensity}</span>
              </button>
            </div>

            {/* THE 3 CORE BUTTONS (1. Play/Stop, 2. Tiempo BPM, 3. Compás) */}
            <ThreeMainButtons
              isPlaying={isPlaying}
              bpm={bpm}
              timeSignature={timeSignature}
              currentBeat={currentBeat}
              soundEnabled={soundEnabled}
              onTogglePlay={handleTogglePlay}
              onOpenTempoModal={() => setIsTempoModalOpen(true)}
              onOpenTimeSignatureModal={() => setIsTimeSignatureModalOpen(true)}
              onAdjustBpm={handleAdjustBpm}
              onToggleSound={handleToggleSound}
            />

            {/* Quick Athletic Context Strip */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Sincronización en Segundo Plano Activa
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Audio contextual sin pausas y reloj de cuarzo de alta precisión
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTempoModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Ver Cadencias
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimeSignatureModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Samsung Galaxy Fit 3 Interactive Wristband (Mobile view 2) */}
          <div
            className={`lg:col-span-5 flex flex-col items-center bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-6 backdrop-blur-sm ${
              mobileTab === 'metronome' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <GalaxyFit3Simulator
              isPlaying={isPlaying}
              bpm={bpm}
              timeSignature={timeSignature}
              currentBeat={currentBeat}
              hapticConfig={hapticConfig}
              onTogglePlay={handleTogglePlay}
              onAdjustBpm={handleAdjustBpm}
              onSetBpm={handleSetBpm}
              onUpdateHapticIntensity={handleUpdateHapticIntensity}
              onOpenFit3Guide={() => setIsFit3GuideOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Footer following Anti-Slop Guidelines */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">PulseFit</span>
            <span>· Metrónomo Deportivo y Compañero Samsung Galaxy Fit 3</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setIsApkInstallerOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              Instalar APK Android
            </button>
            <button
              type="button"
              onClick={() => setIsFit3GuideOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Instrucciones Fit 3
            </button>
            <button
              type="button"
              onClick={() => setIsHapticModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Configurar Vibración
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TempoModal
        isOpen={isTempoModalOpen}
        currentBpm={bpm}
        onClose={() => setIsTempoModalOpen(false)}
        onSelectBpm={handleSetBpm}
      />

      <TimeSignatureModal
        isOpen={isTimeSignatureModalOpen}
        timeSignature={timeSignature}
        soundType={soundType}
        accentFirstBeat={hapticConfig.accentFirstBeat}
        volume={volume}
        onClose={() => setIsTimeSignatureModalOpen(false)}
        onSelectTimeSignature={handleSelectTimeSignature}
        onSelectSoundType={handleSelectSoundType}
        onToggleAccentFirstBeat={() =>
          setHapticConfig((prev) => ({ ...prev, accentFirstBeat: !prev.accentFirstBeat }))
        }
        onChangeVolume={handleChangeVolume}
      />

      <HapticSettingsModal
        isOpen={isHapticModalOpen}
        hapticConfig={hapticConfig}
        onClose={() => setIsHapticModalOpen(false)}
        onUpdateIntensity={handleUpdateHapticIntensity}
        onTogglePhoneVibrate={() =>
          setHapticConfig((prev) => ({ ...prev, vibrateOnPhone: !prev.vibrateOnPhone }))
        }
        onToggleFit3Vibrate={() =>
          setHapticConfig((prev) => ({ ...prev, vibrateOnFit3: !prev.vibrateOnFit3 }))
        }
        onToggleAccentFirstBeat={() =>
          setHapticConfig((prev) => ({ ...prev, accentFirstBeat: !prev.accentFirstBeat }))
        }
      />

      <Fit3PairingGuideModal
        isOpen={isFit3GuideOpen}
        onClose={() => setIsFit3GuideOpen(false)}
      />

      <ApkInstallerModal
        isOpen={isApkInstallerOpen}
        onClose={() => setIsApkInstallerOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
        isInstalled={isInstalled}
      />
    </div>
  );
}
