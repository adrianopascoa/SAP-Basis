import React, { useEffect, useRef, useState } from 'react';
import { Save, X } from 'lucide-react';
import { sanitizeHttpUrl } from '../utils/storageValidation';

interface CustomLinkModalProps {
  isOpen: boolean;
  onSave: (draft: { label: string; url: string }) => void;
  onClose: () => void;
}

export const CustomLinkModal: React.FC<CustomLinkModalProps> = ({
  isOpen,
  onSave,
  onClose,
}) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLabel('');
    setUrl('');
    setErrorMessage(null);

    window.setTimeout(() => {
      labelInputRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setErrorMessage('Informe o nome do link.');
      return;
    }

    const safeUrl = sanitizeHttpUrl(url);
    if (!safeUrl) {
      setErrorMessage('Informe uma URL válida iniciada por http:// ou https://.');
      return;
    }

    onSave({
      label: cleanLabel,
      url: safeUrl,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-link-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-lg bg-white border border-[#E0E4EC] rounded-xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E4EC]">
          <div>
            <h2 id="custom-link-modal-title" className="text-base font-semibold text-[#003865]">
              Novo Link Importante
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adicione um atalho ao menu suspenso de Links Importantes (salvo neste navegador).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de novo link"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="custom-link-label"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nome do link <span className="text-red-600">*</span>
            </label>
            <input
              ref={labelInputRef}
              id="custom-link-label"
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Ex.: 8) ServiceNow"
              className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-3 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
            />
          </div>

          <div>
            <label
              htmlFor="custom-link-url"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              URL de destino <span className="text-red-600">*</span>
            </label>
            <input
              id="custom-link-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="https://..."
              className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-3 text-sm font-mono text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Ao clicar no item do menu, o endereço será aberto em uma nova aba.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E0E4EC]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            data-testid="custom-link-save-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Adicionar Link</span>
          </button>
        </div>
      </form>
    </div>
  );
};
