import React, { useState, useRef } from 'react';
import { 
  Play, 
  Square, 
  Vibrate, 
  Plus, 
  Minus, 
  Bluetooth, 
  BluetoothConnected, 
  Flame, 
  Footprints, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Watch
} from 'lucide-react';
import { HapticConfig, HapticIntensity, TimeSignature } from '../types/metronome';
import { HAPTIC_PRESETS, hapticsService } from '../services/haptics';

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
  onSetBpm,
  onUpdateHapticIntensity,
  onOpenFit3Guide,
}) => {
  // Tile pagination: 0 = Metrónomo Tile, 1 = Intensidad Háptica Tile, 2 = Métricas Ejercicio
  const [activeTileIndex, setActiveTileIndex] = useState<number>(0);
  const [bleStatus, setBleStatus] = useState<{ connected: boolean; name?: string; error?: string }>({
    connected: false,
    name: 'Samsung Galaxy Fit 3',
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);

  // Gesture handling state
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const showGestureToast = (msg: string) => {
    setGestureFeedback(msg);
    setTimeout(() => {
      setGestureFeedback((prev) => (prev === msg ? null : prev));
    }, 1200);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartX.current = clientX;
    touchStartY.current = clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - touchStartX.current;
    const deltaY = clientY - touchStartY.current;

    // Reset touch starts
    touchStartX.current = null;
    touchStartY.current = null;

    const threshold = 35; // px

    // Check if horizontal swipe (changing tiles)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        // swipe left -> next tile
        setActiveTileIndex((prev) => (prev + 1) % 3);
        showGestureToast('Deslizar tarjeta ➔');
      } else {
        // swipe right -> previous tile
        setActiveTileIndex((prev) => (prev === 0 ? 2 : prev - 1));
        showGestureToast('Deslizar tarjeta ⬅');
      }
      return;
    }

    // Check if vertical swipe on metronome tile (change BPM)
    if (Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        // swipe up -> increase BPM
        const step = Math.abs(deltaY) > 90 ? 5 : 1;
        onAdjustBpm(step);
        showGestureToast(`Deslizar arriba: +${step} BPM`);
      } else {
        // swipe down -> decrease BPM
        const step = Math.abs(deltaY) > 90 ? 5 : 1;
        onAdjustBpm(-step);
        showGestureToast(`Deslizar abajo: -${step} BPM`);
      }
    }
  };

  const handleBleConnect = async () => {
    setIsConnecting(true);
    const res = await hapticsService.connectBluetoothWearable();
    setIsConnecting(false);
    if (res.success) {
      setBleStatus({ connected: true, name: res.name || 'Galaxy Fit 3' });
    } else {
      setBleStatus((prev) => ({ ...prev, error: res.error }));
    }
  };

  const isCurrentFirstBeat = currentBeat === 0;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header bar of watch section */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Watch className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Tarjeta Galaxy Fit 3
          </h3>
          <span className="text-[11px] text-slate-400">
            · Sincronización en vivo
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenFit3Guide}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2 cursor-pointer"
        >
          Guía de Vinculación
        </button>
      </div>

      {/* Main Wristband Frame */}
      <div className="relative flex flex-col items-center justify-center py-2 select-none">
        {/* Top Silicone Strap */}
        <div className="w-32 h-14 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-2xl border-t border-x border-slate-700/60 shadow-lg flex flex-col items-center justify-end pb-1.5 opacity-90">
          <div className="w-16 h-1 bg-slate-700/80 rounded-full" />
          <div className="w-12 h-1 bg-slate-700/50 rounded-full mt-1" />
        </div>

        {/* Watch Body (Aluminum Bezel) */}
        <div className="relative w-[280px] h-[440px] bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 rounded-[44px] p-3 shadow-2xl border-2 border-neutral-700/80 ring-1 ring-white/10 flex items-center justify-center">
          {/* Physical Side Key (Right Button of Galaxy Fit 3) */}
          <button
            type="button"
            onClick={onTogglePlay}
            title="Botón físico lateral de la Fit 3: Toca para iniciar/parar"
            className="absolute -right-3 top-28 w-2.5 h-16 bg-neutral-700 hover:bg-neutral-600 active:bg-rose-500 rounded-r-md border border-neutral-600 shadow-md cursor-pointer transition-colors"
            aria-label="Botón lateral físico"
          />

          {/* Screen Bezel (1.6 inch AMOLED, aspect ratio 256 x 402) */}
          <div
            className="relative w-full h-full bg-black rounded-[36px] overflow-hidden flex flex-col justify-between p-4 shadow-inner border border-neutral-800"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
          >
            {/* Haptic Ripple effect on pulse */}
            {isPlaying && (
              <div
                key={currentBeat}
                className={`absolute inset-0 rounded-[36px] pointer-events-none transition-opacity duration-150 ${
                  isCurrentFirstBeat
                    ? 'bg-rose-500/20 ring-4 ring-rose-400/40'
                    : 'bg-sky-400/10 ring-2 ring-sky-300/30'
                }`}
              />
            )}

            {/* Gesture Feedback Floating Badge */}
            {gestureFeedback && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-800/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-slate-700 pointer-events-none animate-bounce">
                {gestureFeedback}
              </div>
            )}

            {/* Top Watch Status Bar */}
            <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pt-1 z-10">
              <span className="font-mono-numbers">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex items-center gap-1.5">
                <Bluetooth className={`w-3 h-3 ${bleStatus.connected ? 'text-sky-400' : 'text-slate-500'}`} />
                <span className="font-mono-numbers text-[10px] text-slate-400">88%</span>
                <div className="w-4 h-2 border border-slate-500 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Watch Content based on Active Tile */}
            <div className="flex-1 flex flex-col justify-center items-center text-center my-1 z-10">
              {activeTileIndex === 0 && (
                /* --- TARJETA 1: METRÓNOMO DEPORTIVO --- */
                <div className="flex flex-col items-center justify-between h-full w-full py-1">
                  {/* Tile title */}
                  <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-rose-400 uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>Tarjeta Metrónomo</span>
                  </div>

                  {/* Big Wrist BPM & Beat Ring */}
                  <div className="relative my-1 flex flex-col items-center justify-center">
                    {/* Visual Pulse Arc */}
                    <div
                      className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-75 ${
                        isPlaying
                          ? isCurrentFirstBeat
                            ? 'border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-500/40 scale-105'
                            : 'border-sky-400 bg-sky-950/20 shadow-md shadow-sky-400/30'
                          : 'border-slate-850 bg-slate-900/40'
                      }`}
                    >
                      <span className="text-4xl font-extrabold font-mono-numbers text-white tracking-tighter">
                        {bpm}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        BPM
                      </span>
                    </div>

                    {/* Beat pill counter */}
                    <div className="mt-2 text-[11px] font-mono-numbers font-bold text-slate-300">
                      {isPlaying
                        ? `Pulso ${currentBeat + 1}/${timeSignature.beats} · ${isCurrentFirstBeat ? '¡Acento!' : 'Paso'}`
                        : `Compás ${timeSignature.beats}/${timeSignature.subdivision}`}
                    </div>
                  </div>

                  {/* Wrist Tactile Touch Controls: (+ / Play / -) */}
                  <div className="w-full flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjustBpm(-5);
                        showGestureToast('-5 BPM');
                      }}
                      className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-750 flex items-center justify-center cursor-pointer transition-transform"
                      title="Bajar ritmo"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlay();
                      }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/40'
                      }`}
                      title={isPlaying ? 'Detener desde pulsera' : 'Iniciar desde pulsera'}
                    >
                      {isPlaying ? (
                        <Square className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjustBpm(5);
                        showGestureToast('+5 BPM');
                      }}
                      className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-750 flex items-center justify-center cursor-pointer transition-transform"
                      title="Subir ritmo"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1">
                    ↕ Desliza vertical para ajustar BPM
                  </p>
                </div>
              )}

              {activeTileIndex === 1 && (
                /* --- TARJETA 2: INTENSIDAD HÁPTICA --- */
                <div className="flex flex-col items-center justify-between h-full w-full py-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-sky-400 uppercase">
                    <Vibrate className="w-3 h-3" />
                    <span>Intensidad Háptica</span>
                  </div>

                  <div className="w-full flex flex-col gap-1.5 my-auto px-1">
                    {(['low', 'medium', 'high', 'ultra'] as HapticIntensity[]).map((level) => {
                      const isSelected = hapticConfig.intensity === level;
                      const preset = HAPTIC_PRESETS[level];

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateHapticIntensity(level);
                            hapticsService.testHaptic(level);
                            showGestureToast(`Vibración: ${preset.label}`);
                          }}
                          className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-slate-950 border-sky-300 font-extrabold shadow-md'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span className="font-mono-numbers text-[10px] opacity-80">
                            {preset.durationMs}ms
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticsService.testHaptic(hapticConfig.intensity, true);
                      showGestureToast('¡Pulso de prueba enviado!');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white text-[11px] font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Vibrate className="w-3.5 h-3.5 text-rose-400" />
                    <span>Probar Vibración</span>
                  </button>
                </div>
              )}

              {activeTileIndex === 2 && (
                /* --- TARJETA 3: CADENCIA Y EJERCICIO --- */
                <div className="flex flex-col items-center justify-between h-full w-full py-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                    <Flame className="w-3 h-3" />
                    <span>Cadencia Running</span>
                  </div>

                  <div className="flex flex-col items-center justify-center my-auto gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Footprints className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono-numbers text-white">
                        {bpm} <span className="text-xs font-normal text-slate-400">SPM</span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-medium">
                        {bpm >= 170 ? 'Cadencia Óptima Running' : bpm >= 150 ? 'Trote Medio' : 'Marcha Aeróbica'}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 px-2">
                      Sincroniza tus pasos con cada pulso en la muñeca para máxima eficiencia biomecánica.
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetBpm(180);
                        showGestureToast('Set: 180 SPM Maratón');
                      }}
                      className="flex-1 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 hover:bg-slate-800"
                    >
                      180 Estándar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetBpm(165);
                        showGestureToast('Set: 165 SPM Trote');
                      }}
                      className="flex-1 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 hover:bg-slate-800"
                    >
                      165 Trote
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Tile Pagination Dots */}
            <div className="w-full flex items-center justify-center gap-1.5 pb-0.5 z-10">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTileIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeTileIndex === idx
                      ? 'w-5 bg-white'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Tarjeta ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Silicone Strap */}
        <div className="w-32 h-14 bg-gradient-to-t from-slate-900 to-slate-800 rounded-b-2xl border-b border-x border-slate-700/60 shadow-lg flex flex-col items-center justify-start pt-1.5 opacity-90">
          <div className="w-12 h-1 bg-slate-700/50 rounded-full" />
          <div className="w-16 h-1 bg-slate-700/80 rounded-full mt-1" />
        </div>
      </div>

      {/* Galaxy Fit 3 Tile Switching & BLE Helper Controls */}
      <div className="w-full max-w-sm mt-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5">
          <button
            type="button"
            onClick={() => setActiveTileIndex((prev) => (prev === 0 ? 2 : prev - 1))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Tarjeta anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-300">
            {activeTileIndex === 0
              ? 'Tarjeta 1: Metrónomo Táctil'
              : activeTileIndex === 1
              ? 'Tarjeta 2: Intensidad Vibración'
              : 'Tarjeta 3: Cadencia Deportiva'}
          </span>

          <button
            type="button"
            onClick={() => setActiveTileIndex((prev) => (prev + 1) % 3)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Siguiente tarjeta"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real BLE pairing action button */}
        <button
          type="button"
          onClick={handleBleConnect}
          disabled={isConnecting}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            bleStatus.connected
              ? 'bg-sky-950/60 text-sky-300 border-sky-800'
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
              <Bluetooth className="w-4 h-4 text-slate-400" />
              <span>{isConnecting ? 'Buscando pulsera...' : 'Escanear Bluetooth Galaxy Fit 3'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
