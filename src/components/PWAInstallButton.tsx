import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#003865] bg-[#EFF5FF] hover:bg-[#DCE9FF] border border-[#BFDBFE] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Instalar aplicativo para uso offline"
      >
        <Download className="w-3.5 h-3.5 text-[#0F62FE]" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#003865] bg-[#EFF5FF] hover:bg-[#DCE9FF] border border-[#BFDBFE] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share className="w-3.5 h-3.5 text-[#0F62FE]" />
          <span>Instalar App</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          >
            <div className="w-full max-w-sm rounded-lg bg-white border border-[#E0E4EC] p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <h3 id="pwa-ios-install-title" className="text-base font-semibold text-[#003865]">
                  Instalar no iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fechar instruções"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
                <li>
                  Toque no botão <strong>Compartilhar</strong> na barra do Safari.
                </li>
                <li>
                  Role as opções e toque em <strong>Adicionar à Tela de Início</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded bg-[#003865] hover:bg-[#0F62FE] py-2 text-xs font-semibold text-white transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
