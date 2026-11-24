import React, { useEffect, useState } from 'react';
import { Eraser, FileText, MailCheck, Plus, Send, Trash2, X } from 'lucide-react';
import {
  ArmLegadosState,
  ArmMultiploState,
  ArmRequestType,
  EncerramentoStandaloneState,
  MultiUserRow,
} from '../types/sapLogs';
import {
  SAP_ENVIRONMENTS,
  generateArmLegadosLog,
  generateArmMultiploLog,
  generateStandaloneEncerramento,
} from '../utils/logGenerators';
import { copyTextToClipboard } from '../utils/clipboard';
import { clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from '../utils/draftStorage';
import { LogConsole } from './LogConsole';

interface ExtraViewBaseProps {
  signature: string;
  onLogGenerated: (payload: {
    area: 'ARM' | 'BRM';
    moduleLabel: string;
    actionLabel: string;
    chamado: string;
    solicitante: string;
    content: string;
  }) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, description?: string) => void;
  onCloseToHub: () => void;
}

const DEFAULT_ARM_LEGADOS_STATE: ArmLegadosState = {
  sistemaLegado: '',
  chamado: '',
  abertoPor: '',
  cargoSolicitante: '',
  deptSolicitante: '',
  nomeCompleto: '',
  loginUsuario: '',
  cargo: '',
  departamento: '',
  perfilAcesso: '',
  tipoAcao: 'Criação',
  terceiro: false,
  observacoes: '',
};

export const ArmLegadosView: React.FC<ExtraViewBaseProps> = ({
  signature,
  onLogGenerated,
  onNotify,
  onCloseToHub,
}) => {
  const [form, setForm] = useState<ArmLegadosState>(() =>
    loadDraft(DRAFT_KEYS.ARM_LEGADOS, DEFAULT_ARM_LEGADOS_STATE)
  );
  const [output, setOutput] = useState('');
  const [actionLabel, setActionLabel] = useState<string | undefined>();

  useEffect(() => {
    saveDraft(DRAFT_KEYS.ARM_LEGADOS, form);
  }, [form]);

  const run = async (mode: 'log' | 'anexo' | 'email') => {
    if (!form.chamado.trim() || !form.sistemaLegado.trim() || !form.nomeCompleto.trim()) {
      onNotify(
        'error',
        'Campos obrigatórios pendentes',
        'Preencha Sistema Legado, Chamado e Nome completo.'
      );
      return;
    }
    const text = generateArmLegadosLog(form, mode, signature);
    const label =
      mode === 'log' ? 'Log Legado' : mode === 'anexo' ? 'Log Anexo Legado' : 'E-mail Legado';
    setOutput(text);
    setActionLabel(label);
    onLogGenerated({
      area: 'ARM',
      moduleLabel: 'ARM · Legados',
      actionLabel: label,
      chamado: form.chamado,
      solicitante: form.abertoPor || form.nomeCompleto,
      content: text,
    });

    const copied = await copyTextToClipboard(text);
    onNotify(
      'success',
      copied ? `${label} gerado e copiado` : `${label} gerado`,
      copied ? 'Copiado automaticamente para a área de transferência.' : undefined
    );
  };

  const handleClear = () => {
    clearDraft(DRAFT_KEYS.ARM_LEGADOS);
    setForm(DEFAULT_ARM_LEGADOS_STATE);
    setOutput('');
    setActionLabel(undefined);
    onNotify('info', 'Campos limpos', 'Formulário e rascunho de Legados reiniciados.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E0E4EC]">
        <div>
          <p className="text-xs text-slate-500">Painel / ARM / Solicitação de acesso Legados</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#003865] mt-0.5">
            Solicitação de Acesso — Sistemas Legados
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
          <button
            type="button"
            onClick={onCloseToHub}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sistema Legado
              </label>
              <input
                type="text"
                placeholder="Ex.: Portal WMS"
                value={form.sistemaLegado}
                onChange={(e) => setForm({ ...form, sistemaLegado: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chamado</label>
              <input
                type="text"
                placeholder="RITM009988"
                value={form.chamado}
                onChange={(e) => setForm({ ...form, chamado: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ação</label>
              <select
                value={form.tipoAcao}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoAcao: e.target.value as ArmLegadosState['tipoAcao'],
                  })
                }
                className="w-full h-9 rounded border border-[#CBD5E1] px-2.5 text-sm bg-white focus:border-[#0F62FE] focus:outline-none"
              >
                <option value="Criação">Criação</option>
                <option value="Alteração">Alteração</option>
                <option value="Bloqueio">Bloqueio</option>
                <option value="Prorrogação">Prorrogação</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aberto Por</label>
              <input
                type="text"
                value={form.abertoPor}
                onChange={(e) => setForm({ ...form, abertoPor: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo Solicitante
              </label>
              <input
                type="text"
                value={form.cargoSolicitante}
                onChange={(e) => setForm({ ...form, cargoSolicitante: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dept. Solicitante
              </label>
              <input
                type="text"
                value={form.deptSolicitante}
                onChange={(e) => setForm({ ...form, deptSolicitante: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E0E4EC]">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                value={form.nomeCompleto}
                onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Login / Usuário
              </label>
              <input
                type="text"
                value={form.loginUsuario}
                onChange={(e) => setForm({ ...form, loginUsuario: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
              <input
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={form.departamento}
                onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Perfil / Acesso
              </label>
              <input
                type="text"
                value={form.perfilAcesso}
                onChange={(e) => setForm({ ...form, perfilAcesso: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 h-9 text-sm text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={form.terceiro}
                onChange={(e) => setForm({ ...form, terceiro: e.target.checked })}
                className="w-4 h-4 accent-[#0F62FE]"
              />
              <span>Terceiro</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full rounded border border-[#CBD5E1] px-3 py-2 text-sm focus:border-[#0F62FE] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => run('anexo')}
              className="h-9 px-3 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded"
            >
              Gerar Log Anexo
            </button>
            <button
              type="button"
              onClick={() => run('log')}
              className="h-9 px-3 text-xs font-semibold text-[#003865] bg-white border border-[#003865] hover:bg-slate-50 rounded"
            >
              Gerar Log
            </button>
            <button
              type="button"
              onClick={() => run('email')}
              className="h-9 px-3 text-xs font-semibold text-white bg-[#003865] hover:bg-[#002241] rounded"
            >
              Gerar E-mail
            </button>
          </div>
        </div>

        <div className="xl:col-span-6">
          <LogConsole
            title="Log Sistema Legado"
            actionLabel={actionLabel}
            value={output}
            onChange={setOutput}
            onCopy={() => onNotify('success', 'Log copiado')}
          />
        </div>
      </div>
    </div>
  );
};

export const ArmMultiploView: React.FC<ExtraViewBaseProps> = ({
  signature,
  onLogGenerated,
  onNotify,
  onCloseToHub,
}) => {
  const emptyRow = (): MultiUserRow => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nomeCompleto: '',
    usuarioSap: '',
    cargo: '',
    departamento: '',
    perfil: '',
    usuarioCopia: '',
  });

  const defaultMultiploState = (): ArmMultiploState => ({
    chamado: '',
    grcRequestNumber: '',
    abertoPor: '',
    cargoSolicitante: '',
    deptSolicitante: '',
    ambiente: 'ECP/EQ1/ED1/ACP/ACQ/ACD',
    tipoSolicitacao: 'Criação de usuário',
    terceiro: false,
    linhas: [emptyRow(), emptyRow()],
  });

  const [form, setForm] = useState<ArmMultiploState>(() => {
    const loaded = loadDraft(DRAFT_KEYS.ARM_MULTIPLO, defaultMultiploState());
    return {
      ...loaded,
      linhas: Array.isArray(loaded.linhas) && loaded.linhas.length > 0 ? loaded.linhas : [emptyRow(), emptyRow()],
    };
  });
  const [output, setOutput] = useState('');
  const [actionLabel, setActionLabel] = useState<string | undefined>();

  useEffect(() => {
    saveDraft(DRAFT_KEYS.ARM_MULTIPLO, form);
  }, [form]);

  const updateRow = (id: string, key: keyof MultiUserRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      linhas: prev.linhas.map((r) => (r.id === id ? { ...r, [key]: value } : r)),
    }));
  };

  const run = async (mode: 'anexo' | 'servnow') => {
    if (!form.chamado.trim() || !form.abertoPor.trim()) {
      onNotify('error', 'Campos obrigatórios', 'Informe Chamado e Aberto Por.');
      return;
    }
    if (mode === 'servnow' && !form.grcRequestNumber.trim()) {
      onNotify('error', 'Campo GRC obrigatório', 'Informe o Nº solicitação GRC.');
      return;
    }
    const text = generateArmMultiploLog(form, mode, signature);
    const label = mode === 'anexo' ? 'Log Múltiplo Anexo' : 'Log Múltiplo Serv. Now';
    setOutput(text);
    setActionLabel(label);
    onLogGenerated({
      area: 'ARM',
      moduleLabel: 'ARM · Solicitação Múltipla',
      actionLabel: label,
      chamado: form.chamado,
      solicitante: form.abertoPor,
      content: text,
    });
    const copied = await copyTextToClipboard(text);
    onNotify(
      'success',
      copied ? `${label} gerado e copiado` : `${label} gerado`,
      copied ? 'Copiado automaticamente para a área de transferência.' : undefined
    );
  };

  const handleClear = () => {
    clearDraft(DRAFT_KEYS.ARM_MULTIPLO);
    setForm(defaultMultiploState());
    setOutput('');
    setActionLabel(undefined);
    onNotify('info', 'Campos limpos', 'Formulário e rascunho de Lote reiniciados.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E0E4EC]">
        <div>
          <p className="text-xs text-slate-500">Painel / ARM / Solicitação de acesso múltiplo</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#003865] mt-0.5">
            Solicitação de Acesso Múltiplo (Lote)
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
          <button
            type="button"
            onClick={onCloseToHub}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chamado</label>
              <input
                type="text"
                value={form.chamado}
                onChange={(e) => setForm({ ...form, chamado: e.target.value })}
                placeholder="RITM0000123"
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº solicitação GRC
              </label>
              <input
                type="text"
                value={form.grcRequestNumber}
                onChange={(e) => setForm({ ...form, grcRequestNumber: e.target.value })}
                placeholder="1234"
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
              <select
                value={form.tipoSolicitacao}
                onChange={(e) =>
                  setForm({ ...form, tipoSolicitacao: e.target.value as ArmRequestType })
                }
                className="w-full h-9 rounded border border-[#CBD5E1] px-2.5 text-sm bg-white focus:border-[#0F62FE] focus:outline-none"
              >
                <option value="Criação de usuário">Criação de usuário</option>
                <option value="Troca de perfil">Troca de perfil</option>
                <option value="Prorrogação de acesso">Prorrogação de acesso</option>
                <option value="Atribuição de perfil Temporario">
                  Atribuição de perfil Temporário
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aberto Por</label>
              <input
                type="text"
                value={form.abertoPor}
                onChange={(e) => setForm({ ...form, abertoPor: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo Solicitante
              </label>
              <input
                type="text"
                value={form.cargoSolicitante}
                onChange={(e) => setForm({ ...form, cargoSolicitante: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dept. Solicitante
              </label>
              <input
                type="text"
                value={form.deptSolicitante}
                onChange={(e) => setForm({ ...form, deptSolicitante: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ambiente</label>
              <input
                list="multi-env-options"
                type="text"
                value={form.ambiente}
                onChange={(e) => setForm({ ...form, ambiente: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
              <datalist id="multi-env-options">
                {SAP_ENVIRONMENTS.map((env) => (
                  <option key={env} value={env} />
                ))}
              </datalist>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#1E293B] mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.terceiro}
                onChange={(e) => setForm({ ...form, terceiro: e.target.checked })}
                className="w-4 h-4 accent-[#0F62FE]"
              />
              <span>Terceiro</span>
            </label>
          </div>

          <div className="pt-3 border-t border-[#E0E4EC] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#003865]">
                Relação de Usuários ({form.linhas.length})
              </span>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, linhas: [...prev.linhas, emptyRow()] }))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0F62FE] hover:bg-[#EFF5FF] rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Usuário</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-auto pr-1">
              {form.linhas.map((row, idx) => (
                <div
                  key={row.id}
                  className="p-3 border border-[#E0E4EC] rounded bg-[#F8FAFC] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Usuário #{idx + 1}</span>
                    {form.linhas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            linhas: prev.linhas.filter((item) => item.id !== row.id),
                          }))
                        }
                        aria-label={`Remover usuário ${idx + 1}`}
                        className="text-slate-400 hover:text-[#DA1E28]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={row.nomeCompleto}
                      onChange={(e) => updateRow(row.id, 'nomeCompleto', e.target.value)}
                      className="h-8 rounded border border-[#CBD5E1] bg-white px-2.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Usuário SAP"
                      value={row.usuarioSap}
                      onChange={(e) => updateRow(row.id, 'usuarioSap', e.target.value)}
                      className="h-8 rounded border border-[#CBD5E1] bg-white px-2.5 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Usuário cópia"
                      value={row.usuarioCopia}
                      onChange={(e) => updateRow(row.id, 'usuarioCopia', e.target.value)}
                      className="h-8 rounded border border-[#CBD5E1] bg-white px-2.5 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Cargo"
                      value={row.cargo}
                      onChange={(e) => updateRow(row.id, 'cargo', e.target.value)}
                      className="h-8 rounded border border-[#CBD5E1] bg-white px-2.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Departamento"
                      value={row.departamento}
                      onChange={(e) => updateRow(row.id, 'departamento', e.target.value)}
                      className="h-8 rounded border border-[#CBD5E1] bg-white px-2.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Perfil SAP"
                      value={row.perfil}
                      onChange={(e) => updateRow(row.id, 'perfil', e.target.value)}
                      className="h-8 rounded border border-[#CBD5E1] bg-white px-2.5 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => run('anexo')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Gerar Log Anexo</span>
            </button>
            <button
              type="button"
              onClick={() => run('servnow')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold text-white bg-[#003865] hover:bg-[#002241] rounded"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gerar Log Serv. Now</span>
            </button>
          </div>
        </div>

        <div className="xl:col-span-5">
          <LogConsole
            title="Log Múltiplo (ARM)"
            actionLabel={actionLabel}
            value={output}
            onChange={setOutput}
            onCopy={() => onNotify('success', 'Log copiado')}
          />
        </div>
      </div>
    </div>
  );
};

interface EncerramentoViewProps extends ExtraViewBaseProps {
  modulo: 'ARM' | 'BRM';
}

export const EncerramentoStandaloneView: React.FC<EncerramentoViewProps> = ({
  modulo,
  signature,
  onLogGenerated,
  onNotify,
  onCloseToHub,
}) => {
  const draftKey = modulo === 'ARM' ? DRAFT_KEYS.ENCERRAMENTO_ARM : DRAFT_KEYS.ENCERRAMENTO_BRM;
  const defaultEncerramentoState: EncerramentoStandaloneState = {
    modulo,
    chamado: '',
    solicitante: '',
    usuarioSap: '',
    ambiente: 'ECP/EQ1/ED1/ACP/ACQ/ACD',
    perfisOuFuncoes: '',
    status: 'Concluído',
    portal: false,
    textoBase: '',
  };

  const [form, setForm] = useState<EncerramentoStandaloneState>(() =>
    loadDraft(draftKey, defaultEncerramentoState)
  );
  const [output, setOutput] = useState('');

  useEffect(() => {
    saveDraft(draftKey, form);
  }, [draftKey, form]);

  const handleGenerate = async () => {
    if (!form.chamado.trim() || !form.solicitante.trim()) {
      onNotify('error', 'Campos obrigatórios', 'Informe Chamado e Solicitante.');
      return;
    }
    const text = generateStandaloneEncerramento({ ...form, modulo }, signature);
    setOutput(text);
    onLogGenerated({
      area: modulo,
      moduleLabel:
        modulo === 'ARM' ? 'Encerramento (Atribuição)' : 'Encerramento (Manutenção)',
      actionLabel: `Encerramento · ${form.status}`,
      chamado: form.chamado,
      solicitante: form.solicitante,
      content: text,
    });
    const copied = await copyTextToClipboard(text);
    onNotify(
      'success',
      copied ? 'Log de encerramento gerado e copiado' : 'Log de encerramento gerado',
      copied ? 'Copiado automaticamente para a área de transferência.' : undefined
    );
  };

  const handleClear = () => {
    clearDraft(draftKey);
    setForm(defaultEncerramentoState);
    setOutput('');
    onNotify('info', 'Campos limpos', 'Formulário e rascunho de encerramento reiniciados.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E0E4EC]">
        <div>
          <p className="text-xs text-slate-500">
            Painel / {modulo} /{' '}
            {modulo === 'ARM' ? 'Encerramento (Atribuição)' : 'Encerramento (Manutenção)'}
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#003865] mt-0.5">
            {modulo === 'ARM'
              ? 'Encerramento de Atribuição (ARM)'
              : 'Encerramento de Manutenção (BRM)'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
          <button
            type="button"
            onClick={onCloseToHub}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chamado</label>
              <input
                type="text"
                value={form.chamado}
                onChange={(e) => setForm({ ...form, chamado: e.target.value })}
                placeholder="TASK0000456"
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Final</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as EncerramentoStandaloneState['status'],
                  })
                }
                className="w-full h-9 rounded border border-[#CBD5E1] px-2.5 text-sm bg-white focus:border-[#0F62FE] focus:outline-none"
              >
                <option value="Concluído">Concluído</option>
                <option value="Reprovado">Reprovado</option>
                <option value="Expirado">Expirado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Solicitante</label>
              <input
                type="text"
                value={form.solicitante}
                onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário SAP</label>
              <input
                type="text"
                value={form.usuarioSap}
                onChange={(e) => setForm({ ...form, usuarioSap: e.target.value })}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ambiente</label>
            <input
              list="enc-env-options"
              type="text"
              value={form.ambiente}
              onChange={(e) => setForm({ ...form, ambiente: e.target.value })}
              className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm focus:border-[#0F62FE] focus:outline-none"
            />
            <datalist id="enc-env-options">
              {SAP_ENVIRONMENTS.map((env) => (
                <option key={env} value={env} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {modulo === 'ARM' ? 'Perfis atribuídos' : 'Funções alteradas'}
            </label>
            <input
              type="text"
              value={form.perfisOuFuncoes}
              onChange={(e) => setForm({ ...form, perfisOuFuncoes: e.target.value })}
              className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-sm font-mono focus:border-[#0F62FE] focus:outline-none"
            />
          </div>

          {modulo === 'ARM' && (
            <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={form.portal}
                onChange={(e) => setForm({ ...form, portal: e.target.checked })}
                className="w-4 h-4 accent-[#0F62FE]"
              />
              <span>Acesso ao Portal incluído</span>
            </label>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Texto adicional
            </label>
            <textarea
              rows={3}
              value={form.textoBase}
              onChange={(e) => setForm({ ...form, textoBase: e.target.value })}
              className="w-full rounded border border-[#CBD5E1] px-3 py-2 text-sm focus:border-[#0F62FE] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded"
          >
            <MailCheck className="w-3.5 h-3.5" />
            <span>Gerar Log de Encerramento</span>
          </button>
        </div>

        <div className="xl:col-span-6">
          <LogConsole
            title="Log de Encerramento"
            actionLabel={form.status}
            value={output}
            onChange={setOutput}
            onCopy={() => onNotify('success', 'Log copiado')}
          />
        </div>
      </div>
    </div>
  );
};
