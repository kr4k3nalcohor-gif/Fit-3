import React from 'react';
import { X, Check, Watch, Download, Sparkles, Vibrate, CheckCircle2 } from 'lucide-react';

interface Fit3PairingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Fit3PairingGuideModal: React.FC<Fit3PairingGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Watch className="w-5 h-5 text-rose-400" />
              Galaxy Fit 3: Carátula y Vibración
            </h2>
            <p className="text-xs text-slate-400">
              Cómo funciona el Controlador Multimedia en tu pulsera Samsung Galaxy Fit 3
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

        {/* Section 1: La Interfaz Real de la Galaxy Fit 3 y Mapeo MediaSession */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>1. Mapeo Oficial: Android MediaSession</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            La Samsung Galaxy Fit 3 (con sistema FreeRTOS) se comunica con PulseFit a través del protocolo oficial de <strong>Android MediaSession</strong>. No requiere instalar apps de terceros en la pulsera:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 list-none">
            <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Botones de Pista (⏭️ y ⏮️) = Ajuste de Tempo (±5 BPM)</strong>
                <span className="text-slate-400 text-[11px]">
                  Pista siguiente sube <strong>+5 BPM</strong> y pista anterior baja <strong>-5 BPM</strong>. El valor se actualiza en tiempo real tanto en la pantalla de la pulsera como en el móvil.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Botón Central (▶ / ⏸) = Iniciar y Pausar</strong>
                <span className="text-slate-400 text-[11px]">
                  Arranca o pausa el bucle rítmico, silenciando el audio y deteniendo la vibración inmediatamente.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Carátula de Telemetría Musical</strong>
                <span className="text-slate-400 text-[11px]">
                  <strong>Título:</strong> PulseFit: En Ritmo · <strong>Artista:</strong> BPM actual · <strong>Álbum:</strong> Compás activo (ej. 4/4) y pulso actual.
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Section 2: Audio en Celular vs Vibración en Fit 3 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Vibrate className="w-4 h-4" />
            <span>2. Salida: Sonido en Celular y Vibración en Muñeca</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Separación física óptima para entrenamientos y prácticas musicales:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Sonido en el Celular</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                El teléfono genera clics acústicos con síntesis AudioTrack PCM de baja latencia (1200 Hz para primer pulso, 820 Hz para pulsos regulares).
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Vibración en la Galaxy Fit 3</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                La pulsera vibra en tu muñeca al ritmo exacto. La vibración en el teléfono viene apagada por defecto para no perturbar el sonido.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Guía de Uso Paso a Paso */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Download className="w-4 h-4" />
            <span>3. Guía Rápida de Activación</span>
          </div>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
            <li>
              Abre la app <strong>Galaxy Wearable</strong> en tu teléfono y asegúrate de tener el mosaico <strong>Controlador Multimedia</strong> activado en tu Galaxy Fit 3.
            </li>
            <li>
              Abre <strong>PulseFit</strong> en tu móvil y pulsa <strong>&quot;1. INICIAR RITMO (PLAY)&quot;</strong>.
            </li>
            <li>
              En tu Galaxy Fit 3, desliza horizontalmente hasta la tarjeta multimedia: verás la carátula activa y podrás controlar el tempo y la reproducción desde tu muñeca.
            </li>
          </ol>
        </div>

        {/* Bottom Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Entendido, volver a la pantalla</span>
        </button>
      </div>
    </div>
  );
};
