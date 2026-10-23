import React from 'react';
import { X, Vibrate, Check, Smartphone, Watch, Zap } from 'lucide-react';
import { HapticConfig, HapticIntensity } from '../types/metronome';
import { HAPTIC_PRESETS, hapticsService } from '../services/haptics';

interface HapticSettingsModalProps {
  isOpen: boolean;
  hapticConfig: HapticConfig;
  onClose: () => void;
  onUpdateIntensity: (intensity: HapticIntensity) => void;
  onTogglePhoneVibrate: () => void;
  onToggleFit3Vibrate: () => void;
  onToggleAccentFirstBeat: () => void;
}

export const HapticSettingsModal: React.FC<HapticSettingsModalProps> = ({
  isOpen,
  hapticConfig,
  onClose,
  onUpdateIntensity,
  onTogglePhoneVibrate,
  onToggleFit3Vibrate,
  onToggleAccentFirstBeat,
}) => {
  if (!isOpen) return null;

  const handleTest = (intensity: HapticIntensity) => {
    hapticsService.testHaptic(intensity, hapticConfig.accentFirstBeat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Vibrate className="w-5 h-5 text-rose-400" />
              Intensidad Háptica y Vibración
            </h2>
            <p className="text-xs text-slate-400">
              Configura la fuerza del pulso vibratorio para mantener tu ritmo en ejercicio
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

        {/* Intensity Selection */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>Nivel de Intensidad</span>
            <span className="text-[11px] text-rose-400 font-semibold lowercase">
              pulsa para probar
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {(['low', 'medium', 'high', 'ultra', 'off'] as HapticIntensity[]).map((level) => {
              const isSelected = hapticConfig.intensity === level;
              const preset = HAPTIC_PRESETS[level];

              return (
                <div
                  key={level}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-400'
                      : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateIntensity(level);
                      handleTest(level);
                    }}
                    className="flex-1 flex flex-col items-start text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{preset.label}</span>
                      {preset.durationMs > 0 && (
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono-numbers text-slate-300">
                          {preset.durationMs}ms
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5">
                      {preset.description}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 pl-3">
                    <button
                      type="button"
                      onClick={() => handleTest(level)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="Probar pulso"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Test</span>
                    </button>
                    {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Targets */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Destinos de Vibración
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleFit3Vibrate}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                hapticConfig.vibrateOnFit3
                  ? 'bg-slate-800 border-sky-400 ring-1 ring-sky-400'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Pulsera Galaxy Fit 3</div>
                <div className="text-[11px] text-slate-400">Vibración en la muñeca</div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  hapticConfig.vibrateOnFit3 ? 'border-sky-400 bg-sky-400' : 'border-slate-600'
                }`}
              >
                {hapticConfig.vibrateOnFit3 && <Check className="w-3 h-3 text-slate-950" />}
              </div>
            </button>

            <button
              type="button"
              onClick={onTogglePhoneVibrate}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                hapticConfig.vibrateOnPhone
                  ? 'bg-slate-800 border-rose-400 ring-1 ring-rose-400'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Teléfono Móvil</div>
                <div className="text-[11px] text-slate-400">Vibración en bolsillo/brazalete</div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  hapticConfig.vibrateOnPhone ? 'border-rose-400 bg-rose-400' : 'border-slate-600'
                }`}
              >
                {hapticConfig.vibrateOnPhone && <Check className="w-3 h-3 text-slate-950" />}
              </div>
            </button>
          </div>
        </div>

        {/* Accent First Beat Toggle */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Doble Pulso en Tiempo Fuerte</div>
            <div className="text-[11px] text-slate-400">
              Vibra dos veces rápidas al inicio de cada compás para guiar la respiración o zancada
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleAccentFirstBeat}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              hapticConfig.accentFirstBeat
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {hapticConfig.accentFirstBeat ? 'Activado' : 'Desactivado'}
          </button>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Guardar Preferencias Hápticas</span>
        </button>
      </div>
    </div>
  );
};
