import React, { useState, useEffect } from 'react';
import { Download, Smartphone, QrCode } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ApkInstallBannerProps {
  onOpenInstallerModal: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onTriggerInstall: () => Promise<void>;
  isInstalled: boolean;
}

export const ApkInstallBanner: React.FC<ApkInstallBannerProps> = ({
  onOpenInstallerModal,
  deferredPrompt,
  onTriggerInstall,
  isInstalled,
}) => {
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (deferredPrompt) {
      onTriggerInstall();
    } else {
      onOpenInstallerModal();
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Instalar como APK Android</span>
            <span className="text-[10px] text-indigo-400 font-normal">· Sin pausas con pantalla apagada</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Instálala en tu teléfono para entrenar con la pantalla bloqueada y sincronizada con tu Galaxy Fit 3
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenInstallerModal}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Ver código QR y pasos"
        >
          <QrCode className="w-4 h-4 text-sky-400" />
        </button>

        <button
          type="button"
          onClick={handleClick}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar APK</span>
        </button>
      </div>
    </div>
  );
};
