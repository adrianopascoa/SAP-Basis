import React, { useEffect, useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import { CustomGeneralLogTemplate } from '../types/sapLogs';
import { extractCustomTemplateVariables } from '../utils/generalLogs';

interface CustomGeneralLogModalProps {
  isOpen: boolean;
  editingTemplate: CustomGeneralLogTemplate | null;
  onSave: (draft: {
    id?: string;
    title: string;
    description: string;
    hasGreeting: boolean;
    bodyTemplate: string;
  }) => void;
  onClose: () => void;
}

export const CustomGeneralLogModal: React.FC<CustomGeneralLogModalProps> = ({
  isOpen,
  editingTemplate,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasGreeting, setHasGreeting] = useState(true);
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTemplate) {
      setTitle(editingTemplate.title);
      setDescription(editingTemplate.description);
      setHasGreeting(editingTemplate.hasGreeting);
      setBodyTemplate(editingTemplate.bodyTemplate);
    } else {
      setTitle('');
      setDescription('');
      setHasGreeting(true);
      setBodyTemplate('');
    }
    setErrorMessage(null);
  }, [editingTemplate, isOpen]);

  const detectedVariables = useMemo(
    () => extractCustomTemplateVariables(bodyTemplate),
    [bodyTemplate]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = bodyTemplate.trim();

    if (!cleanTitle) {
      setErrorMessage('Informe um título para o modelo personalizado.');
      return;
    }
    if (!cleanBody) {
      setErrorMessage('Informe o texto base do modelo.');
      return;
    }

    onSave({
      id: editingTemplate?.id,
      title: cleanTitle,
      description: description.trim(),
      hasGreeting,
      bodyTemplate: cleanBody,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-log-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white border border-[#E0E4EC] rounded-xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E4EC]">
          <div>
            <h2 id="custom-log-modal-title" className="text-base font-semibold text-[#003865]">
              {editingTemplate ? 'Editar Modelo Personalizado' : 'Novo Modelo de Log Geral'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Salve modelos próprios no navegador com campos dinâmicos e assinatura automática.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de modelo personalizado"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
              htmlFor="custom-template-title"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Título do modelo <span className="text-red-600">*</span>
            </label>
            <input
              id="custom-template-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Ex.: 15) Solicitação de evidência GRC"
              className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-3 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
            />
          </div>

          <div>
            <label
              htmlFor="custom-template-description"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Descrição (opcional)
            </label>
            <input
              id="custom-template-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Palavras-chave ou resumo do objetivo do log"
              className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-3 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              id="custom-template-greeting"
              type="checkbox"
              checked={hasGreeting}
              onChange={(e) => setHasGreeting(e.target.checked)}
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#0F62FE] focus:ring-[#0F62FE]"
            />
            <span>Incluir saudação automática por turno (Bom dia / Boa tarde / Boa noite)</span>
          </label>

          <div>
            <label
              htmlFor="custom-template-body"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Corpo da mensagem <span className="text-red-600">*</span>
            </label>
            <textarea
              id="custom-template-body"
              rows={6}
              value={bodyTemplate}
              onChange={(e) => {
                setBodyTemplate(e.target.value);
                setErrorMessage(null);
              }}
              placeholder={'Prezado(a) {{Solicitante}},\nFavor validar o acesso ao perfil {{Perfil}}.'}
              className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm font-mono text-[#1E293B] leading-relaxed focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Use <code className="font-mono text-[#003865]">{'{{NomeDoCampo}}'}</code> para gerar
              campos preenchíveis automaticamente. A assinatura corporativa será incluída no final.
            </p>
            {detectedVariables.length > 0 && (
              <p className="text-xs text-[#003865] font-medium mt-1.5">
                Campos detectados: {detectedVariables.join(', ')}
              </p>
            )}
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
            data-testid="custom-template-save-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{editingTemplate ? 'Salvar Alterações' : 'Criar Modelo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
