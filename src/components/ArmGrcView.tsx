import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Eraser, FileInput, FileText, KeyRound, Send, X } from 'lucide-react';
import { ArmFormState, ArmRequestType } from '../types/sapLogs';
import {
  ARM_EXAMPLE_STATE,
  DEFAULT_ARM_STATE,
  generateArmLog,
  generateArmLogAnexo,
  generateArmLogEncerramento,
  generateArmLogServNow,
  generateSncString,
  validateArmForm,
} from '../utils/logGenerators';
import { copyTextToClipboard } from '../utils/clipboard';
import { clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from '../utils/draftStorage';
import { LogConsole } from './LogConsole';
import { MiniCalendarPopover } from './MiniCalendarPopover';

interface ArmGrcViewProps {
  signature: string;
  onLogGenerated: (payload: {
    area: 'ARM';
    moduleLabel: string;
    actionLabel: string;
    chamado: string;
    solicitante: string;
    content: string;
  }) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, description?: string) => void;
  onCloseToHub: () => void;
}

const REQUEST_TYPES: ArmRequestType[] = [
  'Criação de usuário',
  'Troca de perfil',
  'Delegação de aprovações',
  'Prorrogação de acesso',
  'Atribuição de perfil Temporario',
];

export const ArmGrcView: React.FC<ArmGrcViewProps> = ({
  signature,
  onLogGenerated,
  onNotify,
  onCloseToHub,
}) => {
  const [form, setForm] = useState<ArmFormState>(() =>
    loadDraft(DRAFT_KEYS.ARM_GRC, DEFAULT_ARM_STATE)
  );
  const [output, setOutput] = useState('');
  const [lastActionLabel, setLastActionLabel] = useState<string | undefined>(undefined);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [activeCalendar, setActiveCalendar] = useState<'de' | 'ate' | null>(null);
  const deContainerRef = useRef<HTMLDivElement>(null);
  const ateContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveDraft(DRAFT_KEYS.ARM_GRC, form);
  }, [form]);

  const updateField = <K extends keyof ArmFormState>(key: K, value: ArmFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (missingFields.includes(key)) {
      setMissingFields((prev) => prev.filter((f) => f !== key));
    }
  };

  const showValidityOptions =
    form.terceiro ||
    form.requestType === 'Delegação de aprovações' ||
    form.requestType === 'Prorrogação de acesso' ||
    form.requestType === 'Atribuição de perfil Temporario';

  const hasError = (field: string) => missingFields.includes(field);

  const inputClass = (field: string) =>
    `w-full h-9 rounded border px-3 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 ${
      hasError(field)
        ? 'border-[#DA1E28] focus:border-[#DA1E28] focus:ring-[#DA1E28]/20'
        : 'border-[#CBD5E1] focus:border-[#0F62FE] focus:ring-[#0F62FE]/20'
    }`;

  const handleGenerate = async (mode: 'log' | 'anexo' | 'servnow' | 'encerramento' | 'snc') => {
    const missing = validateArmForm(form, mode);
    if (missing.length > 0) {
      setMissingFields(missing);
      onNotify(
        'error',
        'Campos obrigatórios pendentes',
        'Preencha os campos destacados em vermelho antes de gerar este log.'
      );
      return;
    }

    setMissingFields([]);
    let generated = '';
    let label = '';

    if (mode === 'anexo') {
      generated = generateArmLogAnexo(form);
      label = 'Log Anexo';
    } else if (mode === 'log') {
      generated = generateArmLog(form);
      label = 'Log ARM';
    } else if (mode === 'servnow') {
      generated = generateArmLogServNow(form, signature);
      label = 'Log ServiceNow';
    } else if (mode === 'encerramento') {
      generated = generateArmLogEncerramento(form, signature);
      label = 'Log Encerramento';
    } else if (mode === 'snc') {
      generated = generateSncString(form.usuarioAd, form.adDomain);
      label = 'SNC Gerado';
    }

    setOutput(generated);
    setLastActionLabel(label);

    onLogGenerated({
      area: 'ARM',
      moduleLabel: `ARM · ${form.requestType}`,
      actionLabel: label,
      chamado: form.chamado || form.usuarioAd || '-',
      solicitante: form.abertoPor || form.nomeCompleto || form.usuarioAd || '-',
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

    onNotify('success', `${label} gerado`, 'Pronto para visualização e cópia.');
  };

  const handleClear = () => {
    clearDraft(DRAFT_KEYS.ARM_GRC);
    setForm(DEFAULT_ARM_STATE);
    setOutput('');
    setLastActionLabel(undefined);
    setMissingFields([]);
    onNotify('info', 'Campos limpos', 'Formulário e rascunho ARM reiniciados.');
  };

  const handleLoadExample = () => {
    setForm(ARM_EXAMPLE_STATE);
    setMissingFields([]);
    onNotify('info', 'Exemplo carregado', 'Dados fictícios preenchidos para teste rápido.');
  };

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E0E4EC]">
        <div>
          <p className="text-xs text-slate-500">Painel / ARM / Solicitação de acesso VIA GRC</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#003865] mt-0.5">
            Solicitação de Acesso (ARM — GRC AC)
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

      {/* Main 12-column enterprise workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Column 1 (3 cols): Tipo de solicitação, Opções temporárias & SNC */}
        <div className="xl:col-span-3 space-y-5">
          <section className="bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#003865] pb-2.5 border-b border-[#E0E4EC]">
              Tipo de Solicitação
            </h2>

            <fieldset className="space-y-2.5">
              <legend className="sr-only">Selecione o tipo de solicitação ARM</legend>
              {REQUEST_TYPES.map((type) => {
                const checked = form.requestType === type;
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded border text-sm cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#EFF5FF] border-[#0F62FE] text-[#003865] font-medium'
                        : 'bg-white border-[#E0E4EC] text-[#1E293B] hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="arm-request-type"
                      value={type}
                      checked={checked}
                      onChange={() => updateField('requestType', type)}
                      className="w-4 h-4 accent-[#0F62FE]"
                    />
                    <span className="leading-snug">{type}</span>
                  </label>
                );
              })}
            </fieldset>

            <div className="pt-3 border-t border-[#E0E4EC] space-y-3">
              <label className="flex items-center gap-2.5 text-sm text-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terceiro}
                  onChange={(e) => updateField('terceiro', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0F62FE]"
                />
                <span>Terceiro</span>
              </label>

              {showValidityOptions && (
                <div className="pl-2 space-y-3 pt-1">
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.porData}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            porData: next,
                            emDias: next ? false : prev.emDias,
                          }));
                        }}
                        className="w-4 h-4 rounded accent-[#0F62FE]"
                      />
                      <span>Por data</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.emDias}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            emDias: next,
                            porData: next ? false : prev.porData,
                          }));
                        }}
                        className="w-4 h-4 rounded accent-[#0F62FE]"
                      />
                      <span>Em dias</span>
                    </label>
                  </div>

                  {form.porData && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div ref={deContainerRef} className="relative">
                        <label
                          htmlFor="arm-data-de"
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          De
                        </label>
                        <input
                          id="arm-data-de"
                          type="text"
                          placeholder="20.11.2026"
                          value={form.dataDe}
                          onClick={() => setActiveCalendar('de')}
                          onFocus={() => setActiveCalendar('de')}
                          onChange={(e) => updateField('dataDe', e.target.value)}
                          className="w-full h-9 rounded border border-[#CBD5E1] pl-2.5 pr-7 text-sm font-mono tabular-nums cursor-pointer focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                        />
                        <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-[29px]" />
                        {activeCalendar === 'de' && (
                          <MiniCalendarPopover
                            value={form.dataDe}
                            onSelect={(next) => updateField('dataDe', next)}
                            onClose={() => setActiveCalendar(null)}
                            containerRef={deContainerRef}
                            align="left"
                          />
                        )}
                      </div>
                      <div ref={ateContainerRef} className="relative">
                        <label
                          htmlFor="arm-data-ate"
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Até
                        </label>
                        <input
                          id="arm-data-ate"
                          type="text"
                          placeholder="31.12.2026"
                          value={form.dataAte}
                          onClick={() => setActiveCalendar('ate')}
                          onFocus={() => setActiveCalendar('ate')}
                          onChange={(e) => updateField('dataAte', e.target.value)}
                          className="w-full h-9 rounded border border-[#CBD5E1] pl-2.5 pr-7 text-sm font-mono tabular-nums cursor-pointer focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                        />
                        <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-[29px]" />
                        {activeCalendar === 'ate' && (
                          <MiniCalendarPopover
                            value={form.dataAte}
                            fallbackMonthValue={form.dataDe}
                            onSelect={(next) => updateField('dataAte', next)}
                            onClose={() => setActiveCalendar(null)}
                            containerRef={ateContainerRef}
                            align="right"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {form.emDias && (
                    <div>
                      <label
                        htmlFor="arm-dias"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Dias
                      </label>
                      <input
                        id="arm-dias"
                        type="number"
                        min={1}
                        placeholder="30"
                        value={form.dias}
                        onChange={(e) => updateField('dias', e.target.value)}
                        className="w-28 h-9 rounded border border-[#CBD5E1] px-2.5 text-sm font-mono tabular-nums focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Gerador SNC */}
          <section className="bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-[#003865] pb-2 border-b border-[#E0E4EC]">
              Gerador SNC (AD)
            </h2>

            <div>
              <label
                htmlFor="arm-usuario-ad"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Usuário AD
              </label>
              <input
                id="arm-usuario-ad"
                type="text"
                placeholder="JOAO.EXEMPLO"
                value={form.usuarioAd}
                onChange={(e) => updateField('usuarioAd', e.target.value)}
                className={inputClass('usuarioAd')}
              />
              {hasError('usuarioAd') && (
                <p className="text-xs text-[#DA1E28] mt-1">Informe o Usuário AD.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="arm-ad-domain"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Domínio padrão (quando omitido)
              </label>
              <input
                id="arm-ad-domain"
                type="text"
                value={form.adDomain}
                onChange={(e) => updateField('adDomain', e.target.value)}
                className="w-full h-9 rounded border border-[#CBD5E1] px-3 text-xs font-mono text-slate-700 bg-slate-50 focus:border-[#0F62FE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
              />
            </div>

            <button
              type="button"
              onClick={() => handleGenerate('snc')}
              className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold text-[#003865] bg-white border border-[#003865] hover:bg-[#003865] hover:text-white rounded transition-colors whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Gerar SNC</span>
            </button>
          </section>

          {/* Aprovadores (Serv. Now) */}
          <section className="bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-[#003865] pb-2 border-b border-[#E0E4EC]">
              Aprovadores (Serv. Now)
            </h2>

            <div>
              <label
                htmlFor="arm-aprovador-1"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                1º Aprovador
              </label>
              <input
                id="arm-aprovador-1"
                type="text"
                placeholder="NOME"
                value={form.aprovador1}
                onChange={(e) => updateField('aprovador1', e.target.value)}
                className={inputClass('aprovador1')}
              />
            </div>

            <div>
              <label
                htmlFor="arm-aprovador-2"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                2º Aprovador
              </label>
              <input
                id="arm-aprovador-2"
                type="text"
                placeholder="NOME"
                value={form.aprovador2}
                onChange={(e) => updateField('aprovador2', e.target.value)}
                className={inputClass('aprovador2')}
              />
            </div>
          </section>
        </div>

        {/* Column 2 (4 cols): Dados do Solicitante, Chamado & Usuário */}
        <div className="xl:col-span-4 space-y-5">
          <section className="bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#003865] pb-2.5 border-b border-[#E0E4EC]">
              Dados do Solicitante e Chamado
            </h2>

            <div>
              <label
                htmlFor="arm-aberto-por"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Aberto Por:
              </label>
              <input
                id="arm-aberto-por"
                type="text"
                placeholder="Nome completo de quem abriu o chamado"
                value={form.abertoPor}
                onChange={(e) => updateField('abertoPor', e.target.value)}
                className={inputClass('abertoPor')}
              />
              {hasError('abertoPor') && (
                <p className="text-xs text-[#DA1E28] mt-1">Informe quem abriu o chamado.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="arm-cargo-solicitante"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Cargo Solicitante:
                </label>
                <input
                  id="arm-cargo-solicitante"
                  type="text"
                  placeholder="Ex.: Coordenador"
                  value={form.cargoSolicitante}
                  onChange={(e) => updateField('cargoSolicitante', e.target.value)}
                  className={inputClass('cargoSolicitante')}
                />
              </div>

              <div>
                <label
                  htmlFor="arm-dept-solicitante"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Dept. Solicitante:
                </label>
                <input
                  id="arm-dept-solicitante"
                  type="text"
                  placeholder="Ex.: Controladoria"
                  value={form.deptSolicitante}
                  onChange={(e) => updateField('deptSolicitante', e.target.value)}
                  className={inputClass('deptSolicitante')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="arm-chamado"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Chamado
                </label>
                <input
                  id="arm-chamado"
                  type="text"
                  placeholder="Ex.: RITM0000123"
                  value={form.chamado}
                  onChange={(e) => updateField('chamado', e.target.value)}
                  className={`${inputClass('chamado')} font-mono`}
                />
                {hasError('chamado') && (
                  <p className="text-xs text-[#DA1E28] mt-1">Número do chamado obrigatório.</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="arm-grc-number"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nº solicitação GRC
                </label>
                <input
                  id="arm-grc-number"
                  type="text"
                  placeholder="Ex.: 1234"
                  value={form.grcRequestNumber}
                  onChange={(e) => updateField('grcRequestNumber', e.target.value)}
                  className={`${inputClass('grcRequestNumber')} font-mono tabular-nums`}
                />
                {hasError('grcRequestNumber') && (
                  <p className="text-xs text-[#DA1E28] mt-1">Obrigatório para Log Serv. Now.</p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E0E4EC] space-y-3.5">
              {form.requestType === 'Delegação de aprovações' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="arm-atual-aprovador"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Usuário do Atual aprovador
                      </label>
                      <input
                        id="arm-atual-aprovador"
                        type="text"
                        placeholder="USER_ATUAL"
                        value={form.usuarioAtualAprovador}
                        onChange={(e) => updateField('usuarioAtualAprovador', e.target.value)}
                        className={`${inputClass('usuarioAtualAprovador')} font-mono`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="arm-novo-aprovador"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Usuário do Novo aprovador
                      </label>
                      <input
                        id="arm-novo-aprovador"
                        type="text"
                        placeholder="USER_NOVO"
                        value={form.usuarioNovoAprovador}
                        onChange={(e) => updateField('usuarioNovoAprovador', e.target.value)}
                        className={`${inputClass('usuarioNovoAprovador')} font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="arm-nome-atual-cargo"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Nome Atual aprovador/Cargo
                    </label>
                    <input
                      id="arm-nome-atual-cargo"
                      type="text"
                      placeholder="Nome / Cargo atual"
                      value={form.nomeAtualAprovadorCargo}
                      onChange={(e) => updateField('nomeAtualAprovadorCargo', e.target.value)}
                      className={inputClass('nomeAtualAprovadorCargo')}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="arm-nome-novo-cargo"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Nome Novo aprovador/cargo
                    </label>
                    <input
                      id="arm-nome-novo-cargo"
                      type="text"
                      placeholder="Nome / Cargo novo"
                      value={form.nomeNovoAprovadorCargo}
                      onChange={(e) => updateField('nomeNovoAprovadorCargo', e.target.value)}
                      className={inputClass('nomeNovoAprovadorCargo')}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="arm-delegar-perfil"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Delegar perfil
                    </label>
                    <input
                      id="arm-delegar-perfil"
                      type="text"
                      placeholder="Perfil / função de aprovação"
                      value={form.delegarPerfil}
                      onChange={(e) => updateField('delegarPerfil', e.target.value)}
                      className={`${inputClass('delegarPerfil')} font-mono`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="arm-usuario-copia"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Usuário Copia SAP
                      </label>
                      <input
                        id="arm-usuario-copia"
                        type="text"
                        placeholder="Ex.: USRCOPIA01"
                        value={form.usuarioCopiaSap}
                        onChange={(e) => updateField('usuarioCopiaSap', e.target.value)}
                        className={`${inputClass('usuarioCopiaSap')} font-mono`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="arm-usuario-sap"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Usuário SAP
                      </label>
                      <input
                        id="arm-usuario-sap"
                        type="text"
                        placeholder="Ex.: USREXEMPLO01"
                        value={form.usuarioSap}
                        onChange={(e) => updateField('usuarioSap', e.target.value)}
                        className={`${inputClass('usuarioSap')} font-mono`}
                      />
                      {hasError('usuarioSap') && (
                        <p className="text-xs text-[#DA1E28] mt-1">Informe o Usuário SAP.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="arm-nome-completo"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Nome completo
                    </label>
                    <input
                      id="arm-nome-completo"
                      type="text"
                      placeholder="Nome completo do colaborador"
                      value={form.nomeCompleto}
                      onChange={(e) => updateField('nomeCompleto', e.target.value)}
                      className={inputClass('nomeCompleto')}
                    />
                    {hasError('nomeCompleto') && (
                      <p className="text-xs text-[#DA1E28] mt-1">Informe o nome completo.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="arm-cargo"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Cargo
                      </label>
                      <input
                        id="arm-cargo"
                        type="text"
                        placeholder="Cargo do colaborador"
                        value={form.cargo}
                        onChange={(e) => updateField('cargo', e.target.value)}
                        className={inputClass('cargo')}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="arm-departamento"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Departamento
                      </label>
                      <input
                        id="arm-departamento"
                        type="text"
                        placeholder="Departamento"
                        value={form.departamento}
                        onChange={(e) => updateField('departamento', e.target.value)}
                        className={inputClass('departamento')}
                      />
                    </div>
                  </div>

                  {form.requestType === 'Troca de perfil' ? (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label
                          htmlFor="arm-de-perfil"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          De perfil:
                        </label>
                        <input
                          id="arm-de-perfil"
                          type="text"
                          placeholder="Perfil atual a remover"
                          value={form.dePerfil}
                          onChange={(e) => updateField('dePerfil', e.target.value)}
                          className={`${inputClass('dePerfil')} font-mono`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="arm-para-perfil"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Para perfil:
                        </label>
                        <input
                          id="arm-para-perfil"
                          type="text"
                          placeholder="Novo perfil a atribuir"
                          value={form.paraPerfil}
                          onChange={(e) => updateField('paraPerfil', e.target.value)}
                          className={`${inputClass('paraPerfil')} font-mono`}
                        />
                      </div>
                    </div>
                  ) : form.requestType === 'Prorrogação de acesso' ? (
                    <div>
                      <label
                        htmlFor="arm-prorrogar-perfil"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Prorrogar perfil
                      </label>
                      <input
                        id="arm-prorrogar-perfil"
                        type="text"
                        placeholder="Perfil(is) a prorrogar"
                        value={form.prorrogarPerfil}
                        onChange={(e) => updateField('prorrogarPerfil', e.target.value)}
                        className={`${inputClass('prorrogarPerfil')} font-mono`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="arm-perfil"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Perfil
                      </label>
                      <textarea
                        id="arm-perfil"
                        rows={3}
                        placeholder="Ex.: Z:EXEMPLO_PERFIL_01"
                        value={form.perfil}
                        onChange={(e) => updateField('perfil', e.target.value)}
                        className={`w-full rounded border px-3 py-2 text-sm font-mono text-[#1E293B] bg-white focus:outline-none focus:ring-2 resize-y ${
                          hasError('perfil')
                            ? 'border-[#DA1E28] focus:border-[#DA1E28] focus:ring-[#DA1E28]/20'
                            : 'border-[#CBD5E1] focus:border-[#0F62FE] focus:ring-[#0F62FE]/20'
                        }`}
                      />
                      {hasError('perfil') && (
                        <p className="text-xs text-[#DA1E28] mt-1">Informe o perfil SAP.</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <label
                  htmlFor="arm-ambiente"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Ambiente
                </label>
                <input
                  id="arm-ambiente"
                  type="text"
                  placeholder="ECP/EQ1/ED1/ACP/ACQ/ACD"
                  value={form.ambiente}
                  onChange={(e) => updateField('ambiente', e.target.value)}
                  className={inputClass('ambiente')}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Column 3 (5 cols): Botões de Geração & Console de Log */}
        <div className="xl:col-span-5 space-y-5">
          {/* Primary Action Buttons */}
          <div className="bg-white border border-[#E0E4EC] rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleGenerate('anexo')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Gerar Log Anexo</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate('log')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold text-[#003865] bg-white border border-[#003865] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Gerar Log GRC</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate('servnow')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold text-white bg-[#003865] hover:bg-[#002241] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gerar Log Serv. Now</span>
            </button>
          </div>

          <LogConsole
            title="Saída do Log (ARM)"
            actionLabel={lastActionLabel}
            value={output}
            onChange={setOutput}
            onCopy={() =>
              onNotify('success', 'Log copiado', 'Conteúdo copiado para a área de transferência.')
            }
            emptyHint="Preencha os dados do chamado e clique em Gerar Log Anexo, Gerar Log GRC, Gerar Log Serv. Now ou Gerar SNC."
          />
        </div>
      </div>
    </div>
  );
};
