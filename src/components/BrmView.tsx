import React, { useEffect, useState } from 'react';
import { Eraser, FileCode2, FileInput, Mail, X } from 'lucide-react';
import { BrmFormState } from '../types/sapLogs';
import {
  BRM_EXAMPLE_STATE,
  BRM_QUALITY_ENVIRONMENTS,
  DEFAULT_BRM_STATE,
  generateBrmCobrancaEmail,
  generateBrmLogTecnico,
  validateBrmForm,
} from '../utils/logGenerators';
import { copyTextToClipboard } from '../utils/clipboard';
import { clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from '../utils/draftStorage';
import { LogConsole } from './LogConsole';

interface BrmViewProps {
  mode: 'manutencao' | 'legados';
  signature: string;
  onLogGenerated: (payload: {
    area: 'BRM';
    moduleLabel: string;
    actionLabel: string;
    chamado: string;
    solicitante: string;
    content: string;
  }) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, description?: string) => void;
  onCloseToHub: () => void;
}


export const BrmView: React.FC<BrmViewProps> = ({
  mode,
  signature,
  onLogGenerated,
  onNotify,
  onCloseToHub,
}) => {
  const draftKey = mode === 'legados' ? DRAFT_KEYS.BRM_LEGADOS : DRAFT_KEYS.BRM_MANUTENCAO;
  const baseDefaultState =
    mode === 'legados'
      ? { ...DEFAULT_BRM_STATE, ambiente: 'Sistema Legado' }
      : DEFAULT_BRM_STATE;

  const [form, setForm] = useState<BrmFormState>(() => loadDraft(draftKey, baseDefaultState));
  const [output, setOutput] = useState('');
  const [lastActionLabel, setLastActionLabel] = useState<string | undefined>(undefined);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    saveDraft(draftKey, form);
  }, [draftKey, form]);

  const updateField = <K extends keyof BrmFormState>(key: K, value: BrmFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (missingFields.includes(key)) {
      setMissingFields((prev) => prev.filter((f) => f !== key));
    }
  };

  const hasError = (field: string) => missingFields.includes(field);

  const inputClass = (field: string) =>
    `w-full h-9 rounded border px-3 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 ${
      hasError(field)
        ? 'border-[#DA1E28] focus:border-[#DA1E28] focus:ring-[#DA1E28]/20'
        : 'border-[#CBD5E1] focus:border-[#0F62FE] focus:ring-[#0F62FE]/20'
    }`;

  const handleGenerate = async (action: 'tecnico' | 'cobranca') => {
    const missing = validateBrmForm(form, action);
    if (missing.length > 0) {
      setMissingFields(missing);
      onNotify(
        'error',
        'Campos obrigatórios pendentes',
        'Preencha os campos destacados antes de gerar este registro.'
      );
      return;
    }

    setMissingFields([]);
    const generated =
      action === 'tecnico'
        ? generateBrmLogTecnico(form)
        : generateBrmCobrancaEmail(form, signature);
    const label = action === 'tecnico' ? 'Log Técnico' : 'E-mail de Cobrança';

    setOutput(generated);
    setLastActionLabel(label);

    onLogGenerated({
      area: 'BRM',
      moduleLabel: mode === 'legados' ? 'BRM · Manutenção Legados' : 'BRM · Manutenção de Função',
      actionLabel: label,
      chamado: form.numeroChamado,
      solicitante: form.nomeSolicitante,
      content: generated,
    });

    const copied = await copyTextToClipboard(generated);

    if (copied) {
      onNotify(
        'success',
        `${label} gerado e copiado`,
        'Copiado automaticamente para a área de transferência.'
      );
      return;
    }

    onNotify('success', `${label} gerado`, 'Registro disponível no console de saída.');
  };

  const handleClear = () => {
    clearDraft(draftKey);
    setForm(baseDefaultState);
    setOutput('');
    setLastActionLabel(undefined);
    setMissingFields([]);
    onNotify('info', 'Campos limpos', 'Formulário e rascunho BRM reiniciados.');
  };

  const handleLoadExample = () => {
    setForm(BRM_EXAMPLE_STATE);
    setMissingFields([]);
    onNotify('info', 'Exemplo carregado', 'Dados fictícios de TASK0000456 preenchidos para conferência.');
  };

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E0E4EC]">
        <div>
          <p className="text-xs text-slate-500">
            Painel / BRM / {mode === 'legados' ? 'Manutenção de Função Legados' : 'Manutenção de Função'}
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#003865] mt-0.5">
            {mode === 'legados' ? 'Manutenção de Função — Legados' : 'Manutenção de Função (BRM)'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleLoadExample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
          >
            <FileInput className="w-3.5 h-3.5 text-[#0F62FE]" />
            <span>Carregar Exemplo</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>

          <button
            type="button"
            onClick={onCloseToHub}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Form fields matching Image 9 */}
        <div className="xl:col-span-6 space-y-5">
          <section className="bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">

            <div>
              <label
                htmlFor="brm-nome-solicitante"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nome do solicitante
              </label>
              <input
                id="brm-nome-solicitante"
                type="text"
                placeholder="Ex.: Fulano de Tal Exemplo"
                value={form.nomeSolicitante}
                onChange={(e) => updateField('nomeSolicitante', e.target.value)}
                className={inputClass('nomeSolicitante')}
              />
              {hasError('nomeSolicitante') && (
                <p className="text-xs text-[#DA1E28] mt-1">Informe o nome do solicitante.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label
                  htmlFor="brm-numero-chamado"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Número do Chamado
                </label>
                <input
                  id="brm-numero-chamado"
                  type="text"
                  placeholder="TASK0000456"
                  value={form.numeroChamado}
                  onChange={(e) => updateField('numeroChamado', e.target.value)}
                  className={`${inputClass('numeroChamado')} font-mono`}
                />
                {hasError('numeroChamado') && (
                  <p className="text-xs text-[#DA1E28] mt-1">Informe o chamado.</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="brm-usuario-sap"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Usuário SAP
                </label>
                <input
                  id="brm-usuario-sap"
                  type="text"
                  placeholder="FULANO01"
                  value={form.usuarioSap}
                  onChange={(e) => updateField('usuarioSap', e.target.value)}
                  className={`${inputClass('usuarioSap')} font-mono`}
                />
                {hasError('usuarioSap') && (
                  <p className="text-xs text-[#DA1E28] mt-1">Informe o usuário de teste.</p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="brm-ambiente"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Ambiente de teste
                </label>
                <select
                  id="brm-ambiente"
                  value={form.ambiente}
                  onChange={(e) => updateField('ambiente', e.target.value)}
                  className={inputClass('ambiente')}
                >
                  {mode === 'legados' && (
                    <option value="Sistema Legado">Sistema Legado</option>
                  )}
                  {BRM_QUALITY_ENVIRONMENTS.map((env) => (
                    <option key={env} value={env}>
                      {env}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            <div className="pt-2 border-t border-[#E0E4EC]">
              <label
                htmlFor="brm-transacoes"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Transações inclusas
              </label>
              <textarea
                id="brm-transacoes"
                rows={4}
                placeholder="Ex.: SE16N"
                value={form.transacoes}
                onChange={(e) => updateField('transacoes', e.target.value)}
                className="w-full rounded border border-[#CBD5E1] px-3 py-2 text-sm font-mono text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
              />
            </div>

            <div>
              <label
                htmlFor="brm-objetos"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Objetos
              </label>
              <textarea
                id="brm-objetos"
                rows={6}
                placeholder={`Z_OBJ_EXEMPLO\nACTVT: 03\nWERKS: 0001`}
                value={form.objetoNivelOrg}
                onChange={(e) => updateField('objetoNivelOrg', e.target.value)}
                className="w-full rounded border border-[#CBD5E1] px-3 py-2 text-xs font-mono leading-relaxed text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="brm-perfil-mestre"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Perfil Mestre
                </label>
                <input
                  id="brm-perfil-mestre"
                  type="text"
                  placeholder="Z:EXEMPLO_MESTRE_01"
                  value={form.perfilMestre}
                  onChange={(e) => updateField('perfilMestre', e.target.value)}
                  className={`${inputClass('perfilMestre')} font-mono`}
                />
                {hasError('perfilMestre') && (
                  <p className="text-xs text-[#DA1E28] mt-1">
                    Informe o Perfil Mestre ou Perfil Derivado.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="brm-perfil-derivado"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Perfil Derivado
                </label>
                <textarea
                  id="brm-perfil-derivado"
                  rows={2}
                  placeholder="Z:EXEMPLO_DERIVADO_01"
                  value={form.perfilDerivado}
                  onChange={(e) => updateField('perfilDerivado', e.target.value)}
                  className="w-full rounded border border-[#CBD5E1] px-3 py-2 text-sm font-mono text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Action Buttons & Console */}
        <div className="xl:col-span-6 space-y-5">
          <div className="bg-white border border-[#E0E4EC] rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleGenerate('tecnico')}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Gerar log técnico</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate('cobranca')}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold text-white bg-[#003865] hover:bg-[#002241] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>Gerar e-mail cobrança</span>
            </button>
          </div>

          <LogConsole
            title="Logs (BRM)"
            actionLabel={lastActionLabel}
            value={output}
            onChange={setOutput}
            onCopy={() =>
              onNotify('success', 'Texto copiado', 'Log BRM copiado para a área de transferência.')
            }
            emptyHint="Preencha os dados da função e clique em Gerar log técnico ou Gerar e-mail cobrança."
          />
        </div>
      </div>
    </div>
  );
};
