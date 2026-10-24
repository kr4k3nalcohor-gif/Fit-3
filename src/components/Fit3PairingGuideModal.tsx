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

        {/* Section 1: La Interfaz Real de la Galaxy Fit 3 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>1. Interfaz Oficial: Controlador Multimedia</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            La Samsung Galaxy Fit 3 (con sistema FreeRTOS) no permite instalar aplicaciones de terceros directamente en la pulsera. Su forma oficial y probada de controlar el metrónomo es a través de su tarjeta nativa de <strong>Controlador multimedia</strong>:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 list-none">
            <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Carátula de Álbum en Pantalla</strong>
                <span className="text-slate-400 text-[11px]">
                  PulseFit envía la carátula gráfica con el tempo actual, los anillos de pulso y el compás, mostrándola directamente en el fondo de la pantalla de tu Fit 3.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Línea 1: PulseFit: En Ritmo | Línea 2: BPM: 100</strong>
                <span className="text-slate-400 text-[11px]">
                  El título y subtítulo se adaptan al estándar exacto de One UI Watch para ver tus pulsaciones por minuto al instante al mirar tu muñeca.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Botones Táctiles en la Muñeca</strong>
                <span className="text-slate-400 text-[11px]">
                  <strong>|&lt;</strong> resta 5 BPM · <strong>Botón central</strong> pausa/reanuda · <strong>&gt;|</strong> suma 5 BPM.
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Section 2: Vibración en la pulsera Fit 3 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Vibrate className="w-4 h-4" />
            <span>2. Vibración Háptica en la Pulsera</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Para recibir la vibración en tu muñeca con cada pulso del metrónomo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Vía Bluetooth GATT</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Pulsa &quot;Vincular Bluetooth Galaxy Fit 3&quot; para enviar señales hápticas directas al motor de vibración de la pulsera.
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Vía Android Service (APK)</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                El servicio en segundo plano de Android transmite cada cambio de compás con feedback háptico constante tanto al móvil como a los dispositivos emparejados.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Instalar como APK */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Download className="w-4 h-4" />
            <span>3. Instalar en tu Android</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Abre el menú de tu navegador en tu teléfono (Chrome o Samsung Internet) y pulsa <strong>&quot;Instalar aplicación&quot;</strong>. La app se instalará en tu móvil con icono propio y funcionará a pantalla completa para tus entrenamientos.
          </p>
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
