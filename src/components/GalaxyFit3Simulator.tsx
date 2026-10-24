import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause,
  SkipBack, 
  SkipForward, 
  Volume2, 
  Vibrate, 
  Bluetooth, 
  BluetoothConnected, 
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { HapticConfig, HapticIntensity, TimeSignature } from '../types/metronome';
import { HAPTIC_PRESETS, hapticsService } from '../services/haptics';
import { generateCaratulaDataUrl } from '../utils/caratulaGenerator';

interface GalaxyFit3SimulatorProps {
  isPlaying: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  currentBeat: number;
  hapticConfig: HapticConfig;
  onTogglePlay: () => void;
  onAdjustBpm: (delta: number) => void;
  onSetBpm: (bpm: number) => void;
  onUpdateHapticIntensity: (intensity: HapticIntensity) => void;
  onOpenFit3Guide: () => void;
}

export const GalaxyFit3Simulator: React.FC<GalaxyFit3SimulatorProps> = ({
  isPlaying,
  bpm,
  timeSignature,
  currentBeat,
  hapticConfig,
  onTogglePlay,
  onAdjustBpm,
  onUpdateHapticIntensity,
  onOpenFit3Guide,
}) => {
  const [bleStatus, setBleStatus] = useState<{ connected: boolean; name?: string; error?: string }>({
    connected: false,
    name: 'Samsung Galaxy Fit 3',
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [vibrationToast, setVibrationToast] = useState<string | null>(null);
  const [caratulaUrl, setCaratulaUrl] = useState<string>('/caratula-fit3.svg');

  // Keep caratula updated
  useEffect(() => {
    try {
      const url = generateCaratulaDataUrl(bpm, timeSignature.beats, currentBeat, isPlaying);
      setCaratulaUrl(url);
    } catch {
      setCaratulaUrl('/caratula-fit3.svg');
    }
  }, [bpm, timeSignature.beats, isPlaying, currentBeat]);

  const showVibrationFeedback = (msg: string) => {
    setVibrationToast(msg);
    setTimeout(() => {
      setVibrationToast((prev) => (prev === msg ? null : prev));
    }, 1500);
  };

  const handleBleConnect = async () => {
    setIsConnecting(true);
    const res = await hapticsService.connectBluetoothWearable();
    setIsConnecting(false);
    if (res.success) {
      setBleStatus({ connected: true, name: res.name || 'Galaxy Fit 3' });
      showVibrationFeedback('¡Pulsera Fit 3 vinculada por Bluetooth!');
    } else {
      setBleStatus((prev) => ({ ...prev, error: res.error }));
      showVibrationFeedback(res.error || 'Controlador multimedia activo');
    }
  };

  const handleTestVibration = () => {
    hapticsService.testHaptic(hapticConfig.intensity, true);
    showVibrationFeedback(`¡Vibración enviada a la pulsera (${HAPTIC_PRESETS[hapticConfig.intensity].durationMs}ms)!`);
  };

  const isCurrentFirstBeat = currentBeat === 0;

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Header bar of watch section */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <span>Controlador multimedia</span>
            <span className="text-[11px] font-normal text-slate-400">· Galaxy Fit 3</span>
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenFit3Guide}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 cursor-pointer"
        >
          Guía Fit 3
        </button>
      </div>

      {/* Main Wristband Frame (Samsung Galaxy Fit 3 dimensions: 256 x 402 AMOLED display) */}
      <div className="relative flex flex-col items-center justify-center py-1">
        {/* Top Silicone Strap */}
        <div className="w-32 h-12 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-2xl border-t border-x border-slate-700/60 shadow-lg flex flex-col items-center justify-end pb-1.5 opacity-90">
          <div className="w-16 h-1 bg-slate-700/80 rounded-full" />
          <div className="w-12 h-1 bg-slate-700/50 rounded-full mt-1" />
        </div>

        {/* Watch Body (Matte Space Gray / Black Aluminum Bezel) */}
        <div className="relative w-[280px] h-[436px] bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 rounded-[44px] p-3 shadow-2xl border-2 border-neutral-700/80 ring-1 ring-white/10 flex items-center justify-center">
          {/* Physical Side Key (Right Button of Galaxy Fit 3 - exactly like physical device) */}
          <button
            type="button"
            onClick={onTogglePlay}
            title="Botón físico lateral de la Galaxy Fit 3: Toca para Iniciar/Pausar"
            className="absolute -right-3 top-28 w-2.5 h-16 bg-neutral-700 hover:bg-neutral-600 active:bg-rose-500 rounded-r-md border border-neutral-600 shadow-md cursor-pointer transition-colors"
            aria-label="Botón lateral físico Galaxy Fit 3"
          />

          {/* Screen Bezel (1.6" AMOLED, 256 x 402) */}
          <div className="relative w-full h-full bg-black rounded-[36px] overflow-hidden flex flex-col justify-between p-3.5 shadow-inner border border-neutral-800">
            {/* Haptic Vibration visual ripple when beat triggers */}
            {isPlaying && (
              <div
                key={currentBeat}
                className={`absolute inset-0 rounded-[36px] pointer-events-none transition-opacity duration-100 z-30 ${
                  isCurrentFirstBeat
                    ? 'bg-rose-500/25 ring-4 ring-rose-400/50'
                    : 'bg-sky-400/15 ring-2 ring-sky-300/40'
                }`}
              />
            )}

            {/* Gesture / Vibration Feedback Floating Badge */}
            {vibrationToast && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-2xl border border-slate-700 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
                <Vibrate className="w-3 h-3 text-rose-400 animate-bounce" />
                <span>{vibrationToast}</span>
              </div>
            )}

            {/* 1. TOP WATCH STATUS BAR */}
            <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-300 px-1 pt-0.5 z-20">
              <span className="font-mono-numbers tracking-tight">17:09</span>
              <div className="flex items-center gap-1.5">
                <Bluetooth className={`w-3 h-3 ${bleStatus.connected ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="font-mono-numbers text-[10px] text-slate-300">88%</span>
                <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* 2. TRACK METADATA (Replicating exact layout from user's photos) */}
            <div className="w-full flex items-start gap-2 pt-2 px-1 z-20 text-left">
              {/* Blue/Cyan Music app source badge */}
              <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center shrink-0 text-slate-950 mt-0.5 shadow-sm">
                <Activity className="w-3 h-3" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Track Title (e.g. "PulseFit: En Ritmo" / "1 on a Mission") */}
                <h4 className="text-[13px] font-bold text-white truncate leading-tight">
                  {isPlaying ? 'PulseFit: En Ritmo' : 'PulseFit: Pausado'}
                </h4>
                {/* Artist / Subtitle: "BPM: 100" (Exact line from user's photo!) */}
                <p className="text-[12px] font-bold text-slate-300 font-mono-numbers leading-tight mt-0.5">
                  BPM: {bpm}
                </p>
              </div>
            </div>

            {/* 3. CENTRAL CARÁTULA (Album Artwork Screen as shown in IMG-20261023-WA0010_37b1cf06.jpeg) */}
            <div className="relative flex-1 my-2 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 flex items-center justify-center shadow-lg group">
              {/* Background Carátula (Album Artwork) */}
              <img
                src={caratulaUrl}
                alt="Carátula PulseFit en Galaxy Fit 3"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-100 ${
                  isPlaying ? (isCurrentFirstBeat ? 'scale-105 opacity-90' : 'scale-100 opacity-80') : 'opacity-60 grayscale-[20%]'
                }`}
              />

              {/* Subtle dark overlay for One UI button contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />

              {/* Overlaid One UI Watch Media Controller Controls */}
              <div className="relative z-20 w-full flex items-center justify-around px-2">
                {/* Skip Previous (|<< -5 BPM) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdjustBpm(-5);
                    hapticsService.testHaptic('low');
                    showVibrationFeedback('-5 BPM');
                  }}
                  className="w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-90 text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer transition-transform"
                  title="Bajar 5 BPM"
                  aria-label="Anterior (-5 BPM)"
                >
                  <SkipBack className="w-4 h-4 fill-white" />
                </button>

                {/* Big Center Play / Pause Circle with glowing cyan/blue accent ring */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                    hapticsService.testHaptic('medium');
                    showVibrationFeedback(isPlaying ? 'Pausado' : '¡Ritmo en marcha!');
                  }}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-slate-900/90 text-white ring-4 ring-sky-400 shadow-sky-400/50'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 ring-4 ring-sky-300 shadow-sky-500/50'
                  }`}
                  title={isPlaying ? 'Pausar metrónomo' : 'Iniciar metrónomo'}
                  aria-label="Reproducir / Pausar"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-white text-white" />
                  ) : (
                    <Play className="w-7 h-7 fill-slate-950 text-slate-950 ml-1" />
                  )}
                </button>

                {/* Skip Next (>>| +5 BPM) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdjustBpm(5);
                    hapticsService.testHaptic('low');
                    showVibrationFeedback('+5 BPM');
                  }}
                  className="w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-90 text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer transition-transform"
                  title="Subir 5 BPM"
                  aria-label="Siguiente (+5 BPM)"
                >
                  <SkipForward className="w-4 h-4 fill-white" />
                </button>
              </div>

              {/* Dynamic Beat Dots over carátula */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-xs border border-white/10">
                {Array.from({ length: timeSignature.beats }).map((_, bIdx) => (
                  <div
                    key={bIdx}
                    className={`h-1.5 rounded-full transition-all duration-75 ${
                      isPlaying && currentBeat === bIdx
                        ? bIdx === 0
                          ? 'w-4 bg-rose-400 shadow-sm shadow-rose-400'
                          : 'w-3 bg-sky-400 shadow-sm shadow-sky-400'
                        : 'w-1.5 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4. BOTTOM SPEAKER / VOLUME CONTROL (As seen on real Fit 3 screen) */}
            <div className="w-full flex items-center justify-end px-3 py-1 z-20">
              <div 
                className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Volumen multimedia Fit 3"
              >
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Silicone Strap */}
        <div className="w-32 h-12 bg-gradient-to-t from-slate-900 to-slate-800 rounded-b-2xl border-b border-x border-slate-700/60 shadow-lg flex flex-col items-center justify-start pt-1.5 opacity-90">
          <div className="w-12 h-1 bg-slate-700/50 rounded-full" />
          <div className="w-16 h-1 bg-slate-700/80 rounded-full mt-1" />
        </div>
      </div>

      {/* VIBRACIÓN EN LA PULSERA FIT 3 (Dedicated Wristband Haptic Section) */}
      <div className="w-full max-w-sm mt-3 flex flex-col gap-2.5">
        {/* Status card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Vibración en Pulsera Fit 3
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Sincronizada con cada pulso</span>
                </span>
              </div>
            </div>

            {/* Quick Test button */}
            <button
              type="button"
              onClick={handleTestVibration}
              className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Probar pulso vibratorio en la muñeca"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Probar</span>
            </button>
          </div>

          {/* Intensity selector buttons */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {(['low', 'medium', 'high', 'ultra'] as HapticIntensity[]).map((lvl) => {
              const isSelected = hapticConfig.intensity === lvl;
              const preset = HAPTIC_PRESETS[lvl];
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    onUpdateHapticIntensity(lvl);
                    hapticsService.testHaptic(lvl);
                    showVibrationFeedback(`Vibración: ${preset.label}`);
                  }}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {preset.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real BLE pairing action button */}
        <button
          type="button"
          onClick={handleBleConnect}
          disabled={isConnecting}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            bleStatus.connected
              ? 'bg-sky-950/70 text-sky-300 border-sky-700'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
          }`}
        >
          {bleStatus.connected ? (
            <>
              <BluetoothConnected className="w-4 h-4 text-sky-400" />
              <span>Conectado a {bleStatus.name}</span>
            </>
          ) : (
            <>
              <Bluetooth className="w-4 h-4 text-sky-400" />
              <span>{isConnecting ? 'Buscando pulsera...' : 'Vincular Bluetooth Galaxy Fit 3'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
