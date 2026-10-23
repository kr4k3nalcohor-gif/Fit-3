import React from 'react';
import { X, SlidersHorizontal, Check, Volume2, Sparkles, BellRing } from 'lucide-react';
import { SoundType, TimeSignature } from '../types/metronome';
import { TIME_SIGNATURE_PRESETS } from '../data/exercisePresets';

interface TimeSignatureModalProps {
  isOpen: boolean;
  timeSignature: TimeSignature;
  soundType: SoundType;
  accentFirstBeat: boolean;
  volume: number;
  onClose: () => void;
  onSelectTimeSignature: (ts: TimeSignature) => void;
  onSelectSoundType: (sound: SoundType) => void;
  onToggleAccentFirstBeat: () => void;
  onChangeVolume: (vol: number) => void;
}

export const TimeSignatureModal: React.FC<TimeSignatureModalProps> = ({
  isOpen,
  timeSignature,
  soundType,
  accentFirstBeat,
  volume,
  onClose,
  onSelectTimeSignature,
  onSelectSoundType,
  onToggleAccentFirstBeat,
  onChangeVolume,
}) => {
  if (!isOpen) return null;

  const soundOptions: { type: SoundType; label: string; desc: string }[] = [
    { type: 'woodblock', label: 'Bloque de Madera', desc: 'Sonido seco y orgánico, ideal para correr al aire libre' },
    { type: 'digital', label: 'Clic Digital', desc: 'Tono nítido y moderno de estudio' },
    { type: 'beep', label: 'Beep Deportivo', desc: 'Frecuencia alta fácilmente audible con auriculares' },
    { type: 'hiit-kick', label: 'Bombo HIIT Cardio', desc: 'Golpe grave y contundente para entrenamientos funcionales' },
    { type: 'silent', label: 'Silencioso (Solo Vibración)', desc: 'Sin audio, pulso exclusivamente en la muñeca / pulsera' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
              Ajuste de Compás y Sonido
            </h2>
            <p className="text-xs text-slate-400">
              Estructura de tiempos y timbre sonoro del metrónomo
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

        {/* Time Signatures List */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Selecciona el Compás
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIME_SIGNATURE_PRESETS.map((ts) => {
              const isSelected =
                timeSignature.beats === ts.beats && timeSignature.subdivision === ts.subdivision;

              return (
                <button
                  key={`${ts.beats}/${ts.subdivision}`}
                  type="button"
                  onClick={() => onSelectTimeSignature(ts)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xl font-extrabold font-mono-numbers">
                    {ts.beats}/{ts.subdivision}
                  </span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight truncate w-full">
                    {ts.name.split('(')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent First Beat Toggle */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Acentuar Primer Tiempo (Compás Fuerte)
              </div>
              <div className="text-[11px] text-slate-400">
                Produce un doble pulso háptico y tono agudo en el tiempo 1
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={accentFirstBeat}
              onChange={onToggleAccentFirstBeat}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
          </label>
        </div>

        {/* Sound Timbre Selector */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Timbre de Sonido</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {soundOptions.map((opt) => {
              const isSelected = soundType === opt.type;

              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => onSelectSoundType(opt.type)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-400">{opt.desc}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume Slider if sound not silent */}
        {soundType !== 'silent' && (
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>Volumen del Clic Auditivo</span>
              </span>
              <span className="font-mono-numbers">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
            />
          </div>
        )}

        {/* Bottom Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Confirmar Ajustes</span>
        </button>
      </div>
    </div>
  );
};
