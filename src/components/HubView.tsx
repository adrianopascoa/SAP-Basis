import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronDown, Copy, Plus, RotateCcw, Save, Search, Star, X } from 'lucide-react';
import {
  AppRoute,
  CustomGeneralLogTemplate,
  GeneralLogId,
  LogHistoryEntry,
} from '../types/sapLogs';
import { DEFAULT_SIGNATURE } from '../utils/logGenerators';
import { filterAndSortGeneralTemplates, GENERAL_LOG_TEMPLATES } from '../utils/generalLogs';

interface HubViewProps {
  signature: string;
  onSaveSignature: (next: string) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenGeneralLog: (templateId: GeneralLogId) => void;
  onCreateCustomGeneralLog: () => void;
  favoriteGeneralIds: string[];
  customGeneralTemplates: CustomGeneralLogTemplate[];
  onToggleFavoriteGeneralLog: (templateId: GeneralLogId) => void;
  recentLogs: LogHistoryEntry[];
  onCopyLog: (entry: LogHistoryEntry) => void;
}

interface ModuleTile {
  route: AppRoute;
  title: string;
  subtitle: string;
  isPrimary?: boolean;
}

const BRM_MODULES: ModuleTile[] = [
  {
    route: 'brm-manutencao',
    title: 'Manutenção de Função',
    subtitle: 'E-mail de cobrança e log técnico para função mestre/derivada',
    isPrimary: true,
  },
];

const ARM_MODULES: ModuleTile[] = [
  {
    route: 'arm-grc',
    title: 'Solicitação de acesso VIA GRC',
    subtitle: 'Criação, troca de perfil, delegação, prorrogação, perfil temporário, Serv. Now e SNC',
    isPrimary: true,
  },
];

export const HubView: React.FC<HubViewProps> = ({
  signature,
  onSaveSignature,
  onNavigate,
  onOpenGeneralLog,
  onCreateCustomGeneralLog,
  favoriteGeneralIds,
  customGeneralTemplates,
  onToggleFavoriteGeneralLog,
  recentLogs,
  onCopyLog,
}) => {
  const [sigDraft, setSigDraft] = useState(signature);
  const [isGeneralMenuOpen, setIsGeneralMenuOpen] = useState(false);
  const [generalSearchQuery, setGeneralSearchQuery] = useState('');
  const generalMenuRef = useRef<HTMLDivElement>(null);
  const generalSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSigDraft(signature);
  }, [signature]);

  useEffect(() => {
    if (!isGeneralMenuOpen) return;

    window.setTimeout(() => {
      generalSearchInputRef.current?.focus();
    }, 0);

    const handleMouseDown = (event: MouseEvent) => {
      if (generalMenuRef.current && !generalMenuRef.current.contains(event.target as Node)) {
        setIsGeneralMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGeneralMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGeneralMenuOpen]);

  const allGeneralTemplates = [
    ...GENERAL_LOG_TEMPLATES.map((tpl) => ({
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      isCustom: false,
    })),
    ...customGeneralTemplates.map((tpl) => ({
      id: tpl.id as GeneralLogId,
      title: tpl.title,
      description: tpl.description,
      isCustom: true,
    })),
  ];

  const favoriteSet = new Set(favoriteGeneralIds);
  const filteredGeneralTemplates = filterAndSortGeneralTemplates(
    allGeneralTemplates,
    generalSearchQuery,
    favoriteGeneralIds
  );

  const isDirty = sigDraft !== signature;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E0E4EC] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#003865] tracking-tight">
            SAP BASIS
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 tabular-nums">
          <span>3 frentes operacionais</span>
          <span aria-hidden="true">·</span>
          <span>{allGeneralTemplates.length + 2} modelos de log</span>
          <span aria-hidden="true">·</span>
          <span>{recentLogs.length} registros salvos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: BRM & ARM Module Launcher (mirroring Excel Hub) */}
        <div className="lg:col-span-7 space-y-5">
          <section
            aria-labelledby="hub-brm-heading"
            className="bg-white border border-[#E0E4EC] rounded-lg p-5"
          >
            <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-[#E0E4EC]">
              <div>
                <h2 id="hub-brm-heading" className="text-base font-semibold text-[#003865]">
                  BRM — Manutenção de Função
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Business Role Management · Funções mestre, derivadas e testes.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">1 módulo</span>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-3.5">
              {BRM_MODULES.map((mod) => (
                <button
                  key={mod.route}
                  type="button"
                  onClick={() => onNavigate(mod.route)}
                  className={`group text-left p-3.5 rounded border flex flex-col justify-between gap-2 ${
                    mod.isPrimary
                      ? 'bg-[#F8FAFF] border-[#CBD5E1] hover:border-[#0F62FE] hover:bg-[#E8F0FE]'
                      : 'bg-white border-[#E0E4EC] hover:border-[#0F62FE] hover:bg-[#E8F0FE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[#003865] group-hover:text-[#0F62FE] transition-colors">
                      {mod.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F62FE] shrink-0 mt-0.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{mod.subtitle}</p>
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="hub-arm-heading"
            className="bg-white border border-[#E0E4EC] rounded-lg p-5"
          >
            <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-[#E0E4EC]">
              <div>
                <h2 id="hub-arm-heading" className="text-base font-semibold text-[#003865]">
                  ARM — Solicitação de Acesso
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Access Request Management · GRC AC, ServiceNow e gerador SNC
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">1 módulo</span>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-3.5">
              {ARM_MODULES.map((mod) => (
                <button
                  key={mod.route}
                  type="button"
                  onClick={() => onNavigate(mod.route)}
                  className={`group text-left p-3.5 rounded border flex flex-col justify-between gap-2 ${
                    mod.isPrimary
                      ? 'sm:col-span-2 bg-[#F8FAFF] border-[#CBD5E1] hover:border-[#0F62FE] hover:bg-[#E8F0FE]'
                      : 'bg-white border-[#E0E4EC] hover:border-[#0F62FE] hover:bg-[#E8F0FE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[#003865] group-hover:text-[#0F62FE] transition-colors">
                      {mod.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F62FE] shrink-0 mt-0.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{mod.subtitle}</p>
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="hub-gerais-heading"
            className="bg-white border border-[#E0E4EC] rounded-lg p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E0E4EC]">
              <div>
                <h2 id="hub-gerais-heading" className="text-base font-semibold text-[#003865]">
                  Logs Gerais
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comunicações padrão de atendimento com saudação por turno e assinatura automática
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {allGeneralTemplates.length} modelos
                </span>
                <button
                  id="hub-new-custom-log-btn"
                  type="button"
                  onClick={onCreateCustomGeneralLog}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 hover:border-[#0F62FE] rounded transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0F62FE]" />
                  <span>Novo modelo</span>
                </button>
              </div>
            </div>

            <div ref={generalMenuRef} className="relative mt-3.5">
              <button
                id="hub-logs-gerais-button"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isGeneralMenuOpen}
                onClick={() => setIsGeneralMenuOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white bg-[#003865] hover:bg-[#002241] rounded transition-colors"
              >
                <span>Lista de Logs</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isGeneralMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGeneralMenuOpen && (
                <div className="mt-2 w-full rounded border border-[#CBD5E1] bg-white shadow-lg overflow-hidden">
                  <div className="p-2.5 border-b border-[#E0E4EC] bg-[#F8FAFC]">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute left-2.5 top-2.5" />
                      <input
                        ref={generalSearchInputRef}
                        id="hub-logs-search"
                        type="text"
                        value={generalSearchQuery}
                        onChange={(e) => setGeneralSearchQuery(e.target.value)}
                        placeholder="Buscar por palavra-chave (ex.: SU53, senha, aprovadores)..."
                        aria-label="Buscar na Lista de Logs"
                        className="w-full h-8.5 rounded border border-[#CBD5E1] bg-white pl-8 pr-8 text-xs text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                      />
                      {generalSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setGeneralSearchQuery('')}
                          aria-label="Limpar busca na Lista de Logs"
                          className="p-1 text-slate-400 hover:text-slate-700 absolute right-1.5 top-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    role="listbox"
                    aria-label="Lista de modelos de Logs Gerais"
                    className="max-h-72 overflow-y-auto divide-y divide-[#E0E4EC]"
                  >
                    {filteredGeneralTemplates.length === 0 ? (
                      <div className="px-4 py-5 text-center text-xs text-slate-500">
                        Nenhum modelo encontrado para "{generalSearchQuery}".
                      </div>
                    ) : (
                      filteredGeneralTemplates.map((tpl) => {
                        const isFav = favoriteSet.has(tpl.id);
                        return (
                          <div
                            key={tpl.id}
                            role="option"
                            aria-selected={false}
                            className="group flex items-center gap-1 hover:bg-[#E8F0FE]"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavoriteGeneralLog(tpl.id);
                              }}
                              aria-label={isFav ? `Desafixar ${tpl.title}` : `Fixar ${tpl.title}`}
                              aria-pressed={isFav}
                              title={isFav ? 'Remover dos fixados' : 'Fixar no topo'}
                              className={`pl-3 pr-1.5 py-2.5 shrink-0 ${
                                isFav
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-slate-300 hover:text-amber-500'
                              }`}
                            >
                              <Star
                                className="w-4 h-4"
                                fill={isFav ? 'currentColor' : 'none'}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsGeneralMenuOpen(false);
                                onOpenGeneralLog(tpl.id);
                              }}
                              className="flex-1 text-left pr-4 py-2.5 text-sm text-[#1E293B] group-hover:text-[#003865] flex items-center justify-between gap-3 min-w-0"
                            >
                              <div className="min-w-0">
                                <span className="font-medium block truncate">{tpl.title}</span>
                                {(isFav || tpl.isCustom) && (
                                  <span className="text-[11px] text-slate-500 block">
                                    {[isFav ? 'Fixado' : null, tpl.isCustom ? 'Personalizado' : null]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </span>
                                )}
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F62FE] group-hover:translate-x-1 transition-transform shrink-0" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Assinatura + Recent Logs */}
        <div className="lg:col-span-5 space-y-6">
          <section
            aria-labelledby="hub-signature-heading"
            className="bg-white border border-[#E0E4EC] rounded-lg p-6"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E0E4EC]">
              <div>
                <h2 id="hub-signature-heading" className="text-base font-semibold text-[#003865]">
                  Assinatura
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Incluída em e-mails de cobrança, ServiceNow e encerramentos
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label htmlFor="hub-signature-input" className="sr-only">
                Texto da assinatura corporativa
              </label>
              <textarea
                id="hub-signature-input"
                rows={6}
                value={sigDraft}
                onChange={(e) => setSigDraft(e.target.value)}
                className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#1E293B] leading-relaxed focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSigDraft(DEFAULT_SIGNATURE)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#003865] rounded transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar padrão</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSaveSignature(sigDraft)}
                  disabled={!isDirty}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] disabled:bg-slate-300 disabled:cursor-not-allowed rounded transition-colors whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Assinatura</span>
                </button>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="hub-recent-heading"
            className="bg-white border border-[#E0E4EC] rounded-lg p-6"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E0E4EC]">
              <h2 id="hub-recent-heading" className="text-base font-semibold text-[#003865]">
                Atividade Recente
              </h2>
              {recentLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('historico')}
                  className="text-xs font-semibold text-[#0070F2] hover:underline whitespace-nowrap shrink-0"
                >
                  Ver histórico
                </button>
              )}
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center leading-relaxed">
                Nenhum log copiado ou gerado nesta sessão ainda. Escolha um fluxo BRM, ARM ou Logs Gerais ao lado para começar.
              </p>
            ) : (
              <div className="divide-y divide-[#E0E4EC] mt-2">
                {recentLogs.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#003865]">{entry.area}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[#1E293B]">
                          {entry.chamado || 'Sem chamado'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1E293B] truncate mt-0.5">
                        {entry.actionLabel}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCopyLog(entry)}
                      aria-label={`Copiar log ${entry.chamado || entry.actionLabel}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
