import React, { useState, useRef } from 'react';
import { X, Touchpad, Check, Footprints, Flame, Timer } from 'lucide-react';
import { EXERCISE_CADENCE_PRESETS } from '../data/exercisePresets';

interface TempoModalProps {
  isOpen: boolean;
  currentBpm: number;
  onClose: () => void;
  onSelectBpm: (bpm: number) => void;
}

export const TempoModal: React.FC<TempoModalProps> = ({
  isOpen,
  currentBpm,
  onClose,
  onSelectBpm,
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const lastTapRef = useRef<number>(0);

  if (!isOpen) return null;

  const handleTapTempo = () => {
    const now = performance.now();
    const lastTap = lastTapRef.current;
    lastTapRef.current = now;

    // Reset if more than 2.5 seconds between taps
    if (now - lastTap > 2500) {
      setTapTimes([now]);
      return;
    }

    const newTimes = [...tapTimes, now].slice(-5); // keep last 5 taps
    setTapTimes(newTimes);

    if (newTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTimes.length; i++) {
        intervals.push(newTimes[i] - newTimes[i - 1]);
      }
      const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgIntervalMs);
      const clampedBpm = Math.max(30, Math.min(260, calculatedBpm));
      onSelectBpm(clampedBpm);
    }
  };

  const quickIncrements = [-10, -5, -1, 1, 5, 10];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-sky-400" />
              Ajuste de Tiempo (BPM)
            </h2>
            <p className="text-xs text-slate-400">
              Modifica la cadencia de pulso por minuto para tu entrenamiento
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Display & Slider */}
        <div className="flex flex-col items-center justify-center bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold text-white font-mono-numbers">
              {currentBpm}
            </span>
            <span className="text-base font-bold text-sky-400">BPM</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {currentBpm >= 170 ? '🏃‍♂️ Cadencia Óptima de Carrera' : currentBpm >= 140 ? '👟 Trote Continuo' : '🚶‍♂️ Caminata / Marcha'}
          </div>

          {/* Precision Range Slider */}
          <div className="w-full mt-6 px-2">
            <input
              type="range"
              min={40}
              max={240}
              value={currentBpm}
              onChange={(e) => onSelectBpm(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] font-mono-numbers text-slate-500 mt-1.5">
              <span>40 BPM</span>
              <span>120 BPM</span>
              <span>180 (Maratón)</span>
              <span>240 BPM</span>
            </div>
          </div>

          {/* Quick step pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5 w-full">
            {quickIncrements.map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => onSelectBpm(Math.max(40, Math.min(240, currentBpm + inc)))}
                className="py-1.5 px-3 rounded-lg text-xs font-bold font-mono-numbers bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
              >
                {inc > 0 ? `+${inc}` : inc}
              </button>
            ))}
          </div>
        </div>

        {/* Tap Tempo Button */}
        <button
          type="button"
          onClick={handleTapTempo}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <Touchpad className="w-5 h-5" />
          <span>Toca al Ritmo (Tap Tempo)</span>
          {tapTimes.length > 1 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono-numbers">
              {tapTimes.length} toques
            </span>
          )}
        </button>

        {/* Cadence Presets for Sports */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Cadencias Predefinidas para Ejercicio</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXERCISE_CADENCE_PRESETS.map((preset) => {
              const isSelected = currentBpm === preset.bpm;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectBpm(preset.bpm)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-400 shadow-md ring-1 ring-sky-400'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-slate-400" />
                      {preset.label}
                    </span>
                    <span className="font-mono-numbers text-xs font-extrabold text-sky-400">
                      {preset.bpm} BPM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Accept */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Confirmar Tempo</span>
        </button>
      </div>
    </div>
  );
};
