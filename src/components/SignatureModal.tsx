import React, { useState, useEffect } from 'react';
import { RotateCcw, Save, X } from 'lucide-react';
import { DEFAULT_SIGNATURE } from '../utils/logGenerators';

interface SignatureModalProps {
  isOpen: boolean;
  signature: string;
  onSave: (nextSignature: string) => void;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  signature,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState(signature);

  useEffect(() => {
    setDraft(signature);
  }, [signature, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
    >
      <div className="w-full max-w-xl bg-white border border-[#E0E4EC] rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E4EC]">
          <div>
            <h2
              id="signature-modal-title"
              className="text-base font-semibold text-[#003865]"
            >
              Assinatura Corporativa Padrão
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aplicada automaticamente nos logs ServiceNow, encerramentos e e-mails de cobrança.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de assinatura"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="modal-signature-textarea"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Texto da assinatura
            </label>
            <textarea
              id="modal-signature-textarea"
              rows={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E0E4EC]">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_SIGNATURE)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#003865] rounded transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Assinatura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
