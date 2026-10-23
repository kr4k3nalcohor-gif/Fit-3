import React from 'react';
import { X, Check, Watch, Download, Sparkles, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Watch className="w-5 h-5 text-rose-400" />
              Guía Samsung Galaxy Fit 3 y APK
            </h2>
            <p className="text-xs text-slate-400">
              Cómo sincronizar la tarjeta de la pulsera y controlar los BPM desde tu muñeca
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

        {/* Section 1: Tarjeta de la pulsera */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>1. Tarjeta Multimedia en Galaxy Fit 3</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            La pulsera Samsung Galaxy Fit 3 sincroniza automáticamente las sesiones de audio y metrónomo a través de la tarjeta <strong>Controlador Multimedia</strong>:
          </p>
          <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
            <li>
              Abre la app <strong>Galaxy Wearable</strong> en tu móvil Samsung o Android.
            </li>
            <li>
              Ve a <strong>Tarjetas (Widgets)</strong> y confirma que la tarjeta <strong>Controlador multimedia</strong> esté activa en tu pulsera.
            </li>
            <li>
              Al pulsar <strong>Iniciar</strong> en PulseFit, la pantalla de tu Fit 3 mostrará en tiempo real: <em>&quot;⚡ 160 BPM · Compás 4/4&quot;</em>.
            </li>
            <li>
              <strong>Cambiar BPM desde la muñeca:</strong> Toca el botón <em>Siguiente</em> para subir (+5 BPM) o <em>Anterior</em> para bajar (-5 BPM) sin tener que sacar el móvil de la riñonera.
            </li>
          </ul>
        </div>

        {/* Section 2: Vibración háptica en ejercicio */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Watch className="w-4 h-4" />
            <span>2. Retroalimentación Háptica para Ejercicio</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Para mantener un paso regular durante el running, caminata o entrenamiento:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <div className="font-bold text-white mb-1">Vibración en Muñeca</div>
              <div className="text-slate-400 text-[11px]">
                Usa el botón de Escanear Bluetooth en la app para emparejar el canal de alertas y vibración directa en el motor de la Fit 3.
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <div className="font-bold text-white mb-1">Vibración en Brazalete/Móvil</div>
              <div className="text-slate-400 text-[11px]">
                El motor háptico de tu smartphone vibra con pulsos calibrados (de 25ms a 125ms) perceptibles incluso corriendo a ritmo intenso.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Instalar como APK / PWA */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Download className="w-4 h-4" />
            <span>3. Instalar en tu Android (Modo APK Standalone)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Puedes instalar esta aplicación directamente en tu smartphone Android con un solo toque:
          </p>
          <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              En tu navegador (Chrome o Samsung Internet), toca el menú de <strong>tres puntos (⋮)</strong> y selecciona <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Añadir a pantalla de inicio&quot;</strong>. Funcionará como una APK nativa a pantalla completa y sin consumir datos.
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Entendido, volver al metrónomo</span>
        </button>
      </div>
    </div>
  );
};
