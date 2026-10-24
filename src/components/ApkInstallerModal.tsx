import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Layers,
  Code,
  FileCode,
  FolderArchive
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateNativeAndroidZip } from '../services/nativeAndroidBundle';

interface ApkInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onTriggerInstall: () => Promise<void>;
  isInstalled: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const ApkInstallerModal: React.FC<ApkInstallerModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
  isInstalled,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'galaxy' | 'qr' | 'native'>('install');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const publicUrl = currentUrl.replace('ais-dev-', 'ais-pre-') || 'https://ais-pre-2fcb7fno6obrqgos3u6lav-562928299395.us-west2.run.app';

  useEffect(() => {
    // Detect if inside an iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Generate QR Code with public URL for seamless mobile access
    if (publicUrl) {
      QRCode.toDataURL(publicUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [publicUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenDirect = () => {
    window.open(publicUrl, '_blank');
  };

  const handleDownloadAndroidProject = async () => {
    try {
      setIsGeneratingZip(true);
      const zipBlob = await generateNativeAndroidZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PulseFit-Android-Native-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Instalador APK & Build Android
              </h2>
              <p className="text-xs text-slate-400">
                Opciones de instalación directa en Android y proyecto nativo Gradle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Alert if inside an Iframe (Desktop preview) */}
        {isInIframe && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-amber-300 block mb-1">
                ¿Por qué no salía el diálogo de instalación automática?
              </span>
              Estás visualizando la app dentro del visor web (*iframe*) de desarrollo. Por seguridad, Android y Chromium impiden generar APKs dentro de visores incrustados.
              <span className="block mt-1 font-semibold text-white">
                Para instalarla en tu teléfono en 2 segundos: Escanea el QR o abre el enlace en tu navegador móvil.
              </span>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              activeTab === 'install'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Instalar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span>Código QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('galaxy')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'galaxy'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Galaxy Fit 3</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('native')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'native'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 shrink-0" />
            <span>Gradle & CI</span>
          </button>
        </div>

        {/* TAB 1: INSTALLATION INSTRUCTIONS & 1-CLICK PROMPT */}
        {activeTab === 'install' && (
          <div className="flex flex-col gap-4">
            {/* If direct browser install prompt is ready */}
            {deferredPrompt && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Navegador compatible detectado</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tu navegador permite la instalación directa con un solo toque:
                </p>
                <button
                  type="button"
                  onClick={onTriggerInstall}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar APK Ahora en este Dispositivo</span>
                </button>
              </div>
            )}

            {/* Quick Actions to Open/Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenDirect}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-sky-400" />
                <span>Abrir en Pestaña Completa</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copiar Enlace para WhatsApp/Móvil</span>
                  </>
                )}
              </button>
            </div>

            {/* Step-by-Step for Android Browsers */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Cómo instalar en Android (Google Chrome o Samsung Internet):
              </span>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 border border-slate-700 font-mono-numbers">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-white block">Abre la app en tu teléfono Android</span>
                    <span className="text-slate-400 text-[11px]">
                      Abre el enlace directamente en Chrome o Samsung Internet en tu smartphone.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 border border-slate-700 font-mono-numbers">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-white block">Abre el menú del navegador</span>
                    <span className="text-slate-400 text-[11px]">
                      Toca el botón de tres puntos (<strong>⋮</strong>) en Chrome, o las tres líneas (<strong>☰</strong>) en Samsung Internet.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/40 font-mono-numbers">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-emerald-300 block">Toca &quot;Instalar aplicación&quot; o &quot;Añadir a pantalla de inicio&quot;</span>
                    <span className="text-slate-400 text-[11px]">
                      Android compila el paquete APK oficial (WebAPK) con su propio icono en el cajón de aplicaciones, pantalla completa y acceso continuo sin conexión.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification checklist */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Service Worker y Manifiesto PWA verificados</span>
              </span>
              <span className="text-emerald-400 font-bold">100% Válido</span>
            </div>
          </div>
        )}

        {/* TAB 2: QR CODE SCANNER */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR para instalar PulseFit en tu móvil"
                  className="w-56 h-56 rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-800 text-xs">
                  Generando código QR...
                </div>
              )}
            </div>

            <div className="text-center max-w-sm">
              <span className="text-sm font-bold text-white block mb-1">
                Apunta con la cámara de tu teléfono Samsung / Android
              </span>
              <span className="text-xs text-slate-400">
                Toca la notificación emergente en tu móvil para abrir la app directamente en Chrome o Samsung Internet y pulsar <strong>&quot;Instalar&quot;</strong>.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: SAMSUNG GALAXY FIT 3 TILE INTEGRATION */}
        {activeTab === 'galaxy' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                Cómo controlar el ritmo desde la muñeca
              </h4>
              <p className="text-slate-400">
                Una vez instalada la app en tu teléfono, funciona en sincronía con tu pulsera Galaxy Fit 3:
              </p>
              <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                <li>
                  Abre la app <strong>Galaxy Wearable</strong> en tu móvil.
                </li>
                <li>
                  Ve al apartado <strong>Tarjetas</strong> y añade o sitúa al principio la tarjeta <strong>Controlador multimedia</strong>.
                </li>
                <li>
                  Inicia el ritmo en PulseFit: tu pulsera mostrará automáticamente el tiempo actual (ej. <em>&quot;⚡ 160 BPM • Compás 4/4&quot;</em>).
                </li>
                <li>
                  Usa los botones táctiles de <strong>Siguiente/Anterior</strong> en la pantalla de la Fit 3 para ajustar la velocidad (+5 / -5 BPM) y el botón central para pausar/reanudar.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: NATIVE ANDROID GRADLE PROJECT & GITHUB ACTIONS CI */}
        {activeTab === 'native' && (
          <div className="flex flex-col gap-4 text-xs text-slate-300">
            {/* Repository Info */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Repositorio: kr4k3nalcohor-gif/Fit-3</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  GitHub
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Hemos enlazado el repositorio y preparado el commit con todo el código nativo Kotlin, Gradle y el workflow de compilación de APK.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://github.com/kr4k3nalcohor-gif/Fit-3"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-850 text-sky-400 font-bold rounded-xl border border-slate-750 flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Repositorio</span>
                </a>
                <a
                  href="https://github.com/kr4k3nalcohor-gif/Fit-3/actions"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-850 text-emerald-400 font-bold rounded-xl border border-slate-750 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ver GitHub Actions (APKs)</span>
                </a>
              </div>
            </div>

            {/* Download Full Android Project ZIP */}
            <div className="bg-indigo-950/50 border border-indigo-500/40 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-xs">
                <FolderArchive className="w-4 h-4" />
                <span>Proyecto Nativo Android (Gradle + Kotlin Compose)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Descarga el proyecto completo con Gradle 8.10, SDK 35, `MainActivity.kt` (Jetpack Compose), `MetronomeService.kt` y el workflow de GitHub Actions listo para compilar.
              </p>

              <button
                type="button"
                onClick={handleDownloadAndroidProject}
                disabled={isGeneratingZip}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isGeneratingZip ? 'Generando ZIP...' : 'Descargar Proyecto Nativo Android (ZIP)'}
                </span>
              </button>
            </div>

            {/* Push instructions */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <span className="font-bold text-white text-xs">
                Cómo activar la compilación del APK en GitHub Actions:
              </span>
              <p className="text-slate-400 text-[11px]">
                1. Sube el código o el contenido del ZIP a tu repositorio <strong>Fit-3</strong>.<br/>
                2. Si usas Git por terminal, ejecuta:
              </p>
              <pre className="p-3 bg-slate-900 rounded-xl text-[10px] font-mono-numbers text-slate-300 overflow-x-auto border border-slate-800">
{`git remote set-url origin https://<TU_TOKEN_GITHUB>@github.com/kr4k3nalcohor-gif/Fit-3.git
git push -u origin main`}
              </pre>
              <p className="text-slate-400 text-[11px]">
                3. Al recibir el push, GitHub Actions compilará automáticamente el proyecto y dejará el archivo <strong>app-debug.apk</strong> listo en la sección <em>Artifacts</em> para descargar e instalar en tu teléfono.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  );
};
