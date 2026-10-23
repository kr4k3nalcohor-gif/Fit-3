import React from 'react';
import { Play, Square, Gauge, SlidersHorizontal, Plus, Minus, Volume2, VolumeX, Activity } from 'lucide-react';
import { TimeSignature } from '../types/metronome';

interface ThreeMainButtonsProps {
  isPlaying: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  currentBeat: number;
  soundEnabled: boolean;
  onTogglePlay: () => void;
  onOpenTempoModal: () => void;
  onOpenTimeSignatureModal: () => void;
  onAdjustBpm: (delta: number) => void;
  onToggleSound: () => void;
}

export const ThreeMainButtons: React.FC<ThreeMainButtonsProps> = ({
  isPlaying,
  bpm,
  timeSignature,
  currentBeat,
  soundEnabled,
  onTogglePlay,
  onOpenTempoModal,
  onOpenTimeSignatureModal,
  onAdjustBpm,
  onToggleSound,
}) => {
  // Determine cadence description
  const getCadenceLabel = (val: number) => {
    if (val < 110) return 'Caminar / Calentamiento';
    if (val < 130) return 'Marcha activa';
    if (val < 155) return 'Trote suave';
    if (val < 175) return 'Running eficiente';
    if (val < 185) return 'Cadencia maratón (180)';
    return 'Sprint / HIIT explosivo';
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Visual Beat Indicator Dots */}
      <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 backdrop-blur-sm shadow-inner">
        <div className="flex items-center justify-between w-full text-xs text-slate-400 font-medium px-2">
          <span className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${isPlaying ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <span>PULSO EN TIEMPO REAL</span>
          </span>
          <span className="font-mono-numbers text-slate-300">
            {isPlaying ? `Tiempo ${currentBeat + 1} de ${timeSignature.beats}` : 'En espera'}
          </span>
        </div>

        {/* Beats Visualizer */}
        <div className="flex items-center justify-center gap-2.5 w-full py-1">
          {Array.from({ length: timeSignature.beats }).map((_, idx) => {
            const isActive = isPlaying && currentBeat === idx;
            const isFirstBeat = idx === 0;

            return (
              <div
                key={idx}
                className="flex-1 max-w-[56px] flex flex-col items-center gap-1.5 transition-transform duration-75"
                style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)' }}
              >
                <div
                  className={`w-full h-8 rounded-lg flex items-center justify-center font-mono-numbers text-xs font-bold transition-all duration-100 ${
                    isActive
                      ? isFirstBeat
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105 ring-2 ring-rose-300'
                        : 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/40'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-750'
                  }`}
                >
                  {idx + 1}
                </div>
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive
                      ? isFirstBeat
                        ? 'bg-rose-400'
                        : 'bg-sky-400'
                      : 'bg-slate-700'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- BOTÓN 1: PLAY Y STOP (HERO ACTION) --- */}
      <div className="relative group">
        <button
          type="button"
          onClick={onTogglePlay}
          className={`w-full relative overflow-hidden flex items-center justify-between p-5 sm:p-6 rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-xl border ${
            isPlaying
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white border-rose-400/40 shadow-rose-600/30 ring-4 ring-rose-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400/40 shadow-emerald-600/30 hover:brightness-105'
          }`}
          aria-label={isPlaying ? 'Detener metrónomo' : 'Iniciar metrónomo'}
        >
          {/* Subtle animated pulse glow when playing */}
          {isPlaying && (
            <div className="absolute inset-0 bg-white/10 animate-ping pointer-events-none opacity-20" />
          )}

          <div className="flex items-center gap-4 text-left z-10">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform ${
                isPlaying ? 'bg-white/20 text-white' : 'bg-white text-emerald-800 shadow-md'
              }`}
            >
              {isPlaying ? (
                <Square className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-white/80">
                1. Control Principal
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isPlaying ? 'DETENER' : 'INICIAR RITMO'}
              </div>
              <div className="text-xs text-white/90 font-medium">
                {isPlaying ? 'Pulso activo en pulsera y audio' : 'Toca para activar pulso háptico'}
              </div>
            </div>
          </div>

          <div className="z-10 text-right pr-1">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono-numbers ${
                isPlaying
                  ? 'bg-black/30 text-rose-100 border border-white/20'
                  : 'bg-black/20 text-emerald-100 border border-white/20'
              }`}
            >
              {isPlaying ? 'EN EJECUCIÓN' : 'DETENIDO'}
            </span>
          </div>
        </button>
      </div>

      {/* --- GRID PARA BOTÓN 2 Y BOTÓN 3 --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* --- BOTÓN 2: AJUSTE DE TIEMPO (BPM) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Ajuste de Tiempo
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenTempoModal}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Modificar
            </button>
          </div>

          {/* Large Clickable BPM display */}
          <button
            type="button"
            onClick={onOpenTempoModal}
            className="flex items-baseline gap-2 text-left my-2 py-1 group cursor-pointer focus:outline-none"
            title="Toca para abrir selector preciso de BPM"
          >
            <span className="text-5xl font-extrabold text-white font-mono-numbers tracking-tight group-hover:text-sky-300 transition-colors">
              {bpm}
            </span>
            <span className="text-sm font-bold text-slate-400 tracking-wide">
              BPM
            </span>
          </button>

          <p className="text-xs text-slate-400 mb-3 truncate">
            {getCadenceLabel(bpm)}
          </p>

          {/* Quick Step Adjuster for direct tactile changes */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onAdjustBpm(-5)}
              className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Disminuir 5 BPM"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>-5</span>
            </button>
            <button
              type="button"
              onClick={() => onAdjustBpm(-1)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="Disminuir 1 BPM"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => onAdjustBpm(1)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="Aumentar 1 BPM"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => onAdjustBpm(5)}
              className="flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Aumentar 5 BPM"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+5</span>
            </button>
          </div>
        </div>

        {/* --- BOTÓN 3: AJUSTE DE COMPÁS --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-400">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Ajuste de Compás
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenTimeSignatureModal}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Configurar
            </button>
          </div>

          {/* Large Clickable Compás display */}
          <button
            type="button"
            onClick={onOpenTimeSignatureModal}
            className="flex items-baseline gap-2 text-left my-2 py-1 group cursor-pointer focus:outline-none"
            title="Toca para seleccionar compás y acentos"
          >
            <span className="text-5xl font-extrabold text-white font-mono-numbers tracking-tight group-hover:text-emerald-300 transition-colors">
              {timeSignature.beats}/{timeSignature.subdivision}
            </span>
            <span className="text-sm font-bold text-slate-400 tracking-wide">
              TIEMPOS
            </span>
          </button>

          <p className="text-xs text-slate-400 mb-3 truncate">
            {timeSignature.name}
          </p>

          {/* Quick Sound / Mute toggle and time signature cycle */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onOpenTimeSignatureModal}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Cambiar Compás</span>
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-750'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
              }`}
              title={soundEnabled ? 'Silenciar sonido (solo vibración)' : 'Activar sonido'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Audio</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Mute</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
