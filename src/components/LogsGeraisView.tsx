import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Edit3,
  Eraser,
  FileInput,
  FileText,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { CustomGeneralLogTemplate, GeneralLogId, GeneralLogValues } from '../types/sapLogs';
import {
  DEFAULT_GENERAL_LOG_VALUES,
  EXAMPLE_GENERAL_LOG_VALUES,
  GENERAL_LOG_TEMPLATES,
  GreetingShift,
  detectUnfilledPlaceholders,
  extractCustomTemplateVariables,
  filterAndSortGeneralTemplates,
  generateCustomGeneralLog,
  generateGeneralLog,
  getDatePlusDays,
  getDefaultPassword,
  getTimeOfDayGreeting,
} from '../utils/generalLogs';
import { copyTextToClipboard } from '../utils/clipboard';
import { clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from '../utils/draftStorage';
import { LogConsole } from './LogConsole';
import { MiniCalendarPopover } from './MiniCalendarPopover';

const CustomGeneralLogModal = lazy(() =>
  import('./CustomGeneralLogModal').then((m) => ({ default: m.CustomGeneralLogModal }))
);

interface LogsGeraisViewProps {
  initialTemplateId: GeneralLogId;
  signature: string;
  customGeneralTemplates: CustomGeneralLogTemplate[];
  favoriteGeneralIds: string[];
  pendingOpenCreateCustom?: boolean;
  onConsumePendingOpenCreateCustom?: () => void;
  onToggleFavoriteGeneralLog: (templateId: GeneralLogId) => void;
  onSaveCustomGeneralLog: (draft: {
    id?: string;
    title: string;
    description: string;
    hasGreeting: boolean;
    bodyTemplate: string;
  }) => CustomGeneralLogTemplate;
  onDeleteCustomGeneralLog: (id: string) => void;
  onLogGenerated: (payload: {
    area: 'GERAIS';
    moduleLabel: string;
    actionLabel: string;
    chamado: string;
    solicitante: string;
    content: string;
  }) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, description?: string) => void;
  onCloseToHub: () => void;
}

export const LogsGeraisView: React.FC<LogsGeraisViewProps> = ({
  initialTemplateId,
  signature,
  customGeneralTemplates,
  favoriteGeneralIds,
  pendingOpenCreateCustom = false,
  onConsumePendingOpenCreateCustom,
  onToggleFavoriteGeneralLog,
  onSaveCustomGeneralLog,
  onDeleteCustomGeneralLog,
  onLogGenerated,
  onNotify,
  onCloseToHub,
}) => {
  const buildDefaultValues = (): GeneralLogValues => ({
    ...DEFAULT_GENERAL_LOG_VALUES,
    senha: getDefaultPassword(),
    dataLimiteAprovacao: getDatePlusDays(8),
  });

  const [initialDraft] = useState(() =>
    loadDraft(DRAFT_KEYS.LOGS_GERAIS, {
      values: buildDefaultValues(),
      customFieldValues: {} as Record<string, Record<string, string>>,
      greetingMode: 'auto' as 'auto' | GreetingShift,
    })
  );

  const [templateId, setTemplateId] = useState<GeneralLogId>(initialTemplateId);
  const [values, setValues] = useState<GeneralLogValues>(() => ({
    ...buildDefaultValues(),
    ...(initialDraft.values || {}),
  }));
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, Record<string, string>>
  >(() => initialDraft.customFieldValues || {});
  const [greetingMode, setGreetingMode] = useState<'auto' | GreetingShift>(
    () => initialDraft.greetingMode || 'auto'
  );
  const [manualOutput, setManualOutput] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomTemplate, setEditingCustomTemplate] =
    useState<CustomGeneralLogTemplate | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  const dateContainerRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTemplateMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTemplateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isTemplateMenuOpen]);

  useEffect(() => {
    saveDraft(DRAFT_KEYS.LOGS_GERAIS, {
      values,
      customFieldValues,
      greetingMode,
    });
  }, [values, customFieldValues, greetingMode]);

  useEffect(() => {
    setTemplateId(initialTemplateId);
    setManualOutput(null);
    setConfirmDeleteId(null);
  }, [initialTemplateId]);

  useEffect(() => {
    if (pendingOpenCreateCustom) {
      setEditingCustomTemplate(null);
      setIsCustomModalOpen(true);
      onConsumePendingOpenCreateCustom?.();
    }
  }, [pendingOpenCreateCustom, onConsumePendingOpenCreateCustom]);

  const allTemplateItems = useMemo(
    () => [
      ...GENERAL_LOG_TEMPLATES.map((tpl) => ({
        id: tpl.id as GeneralLogId,
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
    ],
    [customGeneralTemplates]
  );

  const favoriteSet = useMemo(() => new Set(favoriteGeneralIds), [favoriteGeneralIds]);

  const filteredTemplates = useMemo(
    () => filterAndSortGeneralTemplates(allTemplateItems, searchQuery, favoriteGeneralIds),
    [allTemplateItems, searchQuery, favoriteGeneralIds]
  );

  const activeCustom = useMemo(
    () => customGeneralTemplates.find((t) => t.id === templateId) || null,
    [customGeneralTemplates, templateId]
  );

  const activeBuiltIn = useMemo(
    () =>
      activeCustom
        ? null
        : GENERAL_LOG_TEMPLATES.find((t) => t.id === templateId) || GENERAL_LOG_TEMPLATES[0],
    [activeCustom, templateId]
  );

  const activeTitle = activeCustom ? activeCustom.title : activeBuiltIn!.title;
  const activeDescription = activeCustom
    ? activeCustom.description || 'Modelo personalizado salvo localmente.'
    : activeBuiltIn!.description;
  const activeHasGreeting = activeCustom ? activeCustom.hasGreeting : activeBuiltIn!.hasGreeting;

  const customVariables = useMemo(
    () => (activeCustom ? extractCustomTemplateVariables(activeCustom.bodyTemplate) : []),
    [activeCustom]
  );

  const autoGreeting = getTimeOfDayGreeting();
  const generatedPreview = activeCustom
    ? generateCustomGeneralLog(
        activeCustom,
        customFieldValues[activeCustom.id] || {},
        signature,
        { greetingOverride: greetingMode }
      )
    : generateGeneralLog(activeBuiltIn!.id, values, signature, {
        greetingOverride: greetingMode,
      });

  const displayOutput = manualOutput !== null ? manualOutput : generatedPreview;

  const emptyFieldLabels = useMemo(() => {
    if (activeCustom) {
      const currentMap = customFieldValues[activeCustom.id] || {};
      return customVariables.filter((varName) => !(currentMap[varName] || '').trim());
    }
    return activeBuiltIn!.fields
      .filter((field) => !values[field.key].trim())
      .map((field) => field.label);
  }, [activeCustom, activeBuiltIn, customFieldValues, customVariables, values]);

  const placeholderCheck = useMemo(
    () => detectUnfilledPlaceholders(displayOutput, signature, emptyFieldLabels),
    [displayOutput, signature, emptyFieldLabels]
  );

  const hasPlaceholderWarning =
    placeholderCheck.tokens.length > 0 || placeholderCheck.missingFields.length > 0;

  const buildWarningDetails = () => {
    const parts: string[] = [];
    if (placeholderCheck.tokens.length > 0) {
      parts.push(`Placeholders no texto: ${placeholderCheck.tokens.join(', ')}`);
    }
    if (placeholderCheck.missingFields.length > 0) {
      parts.push(`Campos em branco: ${placeholderCheck.missingFields.join(', ')}`);
    }
    return parts.join(' · ');
  };

  const updateField = <K extends keyof GeneralLogValues>(key: K, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setManualOutput(null);
  };

  const updateCustomField = (varName: string, val: string) => {
    if (!activeCustom) return;
    setCustomFieldValues((prev) => ({
      ...prev,
      [activeCustom.id]: {
        ...(prev[activeCustom.id] || {}),
        [varName]: val,
      },
    }));
    setManualOutput(null);
  };

  const handleTemplateChange = (nextId: GeneralLogId) => {
    setTemplateId(nextId);
    setManualOutput(null);
    setIsCalendarOpen(false);
    setConfirmDeleteId(null);
    setIsTemplateMenuOpen(false);
  };

  const handleSearchChange = (nextQuery: string) => {
    setSearchQuery(nextQuery);
    const nextFiltered = filterAndSortGeneralTemplates(
      allTemplateItems,
      nextQuery,
      favoriteGeneralIds
    );
    if (nextFiltered.length > 0 && !nextFiltered.some((item) => item.id === templateId)) {
      handleTemplateChange(nextFiltered[0].id);
    }
  };

  const handleGenerateAndSave = async () => {
    const finalOutput = displayOutput;
    setManualOutput(null);

    const activeCustomMap = activeCustom ? customFieldValues[activeCustom.id] || {} : {};
    const firstCustomVal =
      Object.values(activeCustomMap).find((val) => val.trim().length > 0) || '-';

    onLogGenerated({
      area: 'GERAIS',
      moduleLabel: 'Logs Gerais',
      actionLabel: activeTitle,
      chamado: activeCustom
        ? firstCustomVal
        : values.solicitacao || values.perfil || values.usuario || '-',
      solicitante: activeCustom
        ? firstCustomVal
        : values.solicitante ||
          values.colaborador ||
          values.donoPerfil ||
          values.aprovador1 ||
          '-',
      content: finalOutput,
    });

    const copied = await copyTextToClipboard(finalOutput);

    if (hasPlaceholderWarning) {
      onNotify(
        'warning',
        copied
          ? 'Log salvo e copiado com placeholders em aberto'
          : 'Log salvo com placeholders em aberto',
        `${buildWarningDetails()}. Revise antes de enviar.`
      );
    } else if (copied) {
      onNotify(
        'success',
        'Log gerado e copiado',
        `${activeTitle} copiado automaticamente para a área de transferência.`
      );
    } else {
      onNotify('success', 'Log gerado', `${activeTitle} pronto para cópia.`);
    }
  };

  const handleCopyConsole = () => {
    if (hasPlaceholderWarning) {
      onNotify(
        'warning',
        'Atenção: log copiado com placeholders em aberto',
        `${buildWarningDetails()}. Confira antes de colar no ServiceNow ou Outlook.`
      );
      return;
    }
    onNotify('success', 'Log copiado', 'Conteúdo copiado para a área de transferência.');
  };

  const handleClear = () => {
    clearDraft(DRAFT_KEYS.LOGS_GERAIS);
    setValues(buildDefaultValues());
    if (activeCustom) {
      setCustomFieldValues((prev) => ({
        ...prev,
        [activeCustom.id]: {},
      }));
    } else {
      setCustomFieldValues({});
    }
    setGreetingMode('auto');
    setManualOutput(null);
    setIsCalendarOpen(false);
    onNotify('info', 'Campos limpos', 'Valores e rascunho de Logs Gerais reiniciados.');
  };

  const handleLoadExample = () => {
    setValues({
      ...EXAMPLE_GENERAL_LOG_VALUES,
      senha: getDefaultPassword(),
      dataLimiteAprovacao: getDatePlusDays(8),
    });
    if (activeCustom && customVariables.length > 0) {
      const sampleMap: Record<string, string> = {};
      customVariables.forEach((varName, index) => {
        sampleMap[varName] = `Exemplo ${varName} ${index + 1}`;
      });
      setCustomFieldValues((prev) => ({
        ...prev,
        [activeCustom.id]: sampleMap,
      }));
    }
    setManualOutput(null);
    onNotify('info', 'Exemplo carregado', 'Campos preenchidos para conferência.');
  };

  const isCurrentFavorite = favoriteSet.has(activeCustom ? activeCustom.id : activeBuiltIn!.id);

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E0E4EC]">
        <div>
          <p className="text-xs text-slate-500">Painel / Logs Gerais / {activeTitle}</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#003865] mt-0.5">
            Logs Gerais
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="general-log-new-btn"
            type="button"
            onClick={() => {
              setEditingCustomTemplate(null);
              setIsCustomModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 hover:border-[#0F62FE] rounded transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#0F62FE]" />
            <span>Novo Modelo</span>
          </button>

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
        {/* Left: Template selection & dynamic parameters */}
        <div className="xl:col-span-5 space-y-5">
          <section className="bg-white border border-[#E0E4EC] rounded-lg p-5 space-y-4">
            {/* Search filter */}
            <div>
              <label
                htmlFor="general-log-search"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Filtrar modelos
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute left-2.5 top-2.5" />
                <input
                  id="general-log-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Digite SU53, senha, aprovadores..."
                  className="w-full h-9 rounded border border-[#CBD5E1] bg-white pl-8 pr-8 text-xs text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    aria-label="Limpar filtro de modelos"
                    className="p-1 text-slate-400 hover:text-slate-700 absolute right-1.5 top-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="general-log-select"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Modelo de Log Geral
                </label>
                {activeCustom && (
                  <span className="text-[11px] font-medium text-[#003865]">
                    Modelo personalizado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div ref={templateMenuRef} className="relative flex-1 min-w-0">
                  <button
                    id="general-log-select"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isTemplateMenuOpen}
                    onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                    className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-2.5 text-sm font-medium text-[#003865] dark:!text-white !opacity-100 focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20 flex items-center justify-between gap-2 text-left"
                  >
                    <span className="truncate">
                      {isCurrentFavorite ? `★ ${activeTitle}` : activeTitle}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-slate-500 dark:text-slate-300 transition-transform ${
                        isTemplateMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isTemplateMenuOpen && (
                    <div
                      role="listbox"
                      aria-label="Modelo de Log Geral"
                      className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded border border-[#CBD5E1] bg-white shadow-lg divide-y divide-[#E0E4EC]"
                    >
                      {filteredTemplates.length === 0 ? (
                        <div className="px-3.5 py-3 text-xs text-slate-500">
                          Nenhum modelo encontrado.
                        </div>
                      ) : (
                        filteredTemplates.map((tpl) => {
                          const activeId = activeCustom ? activeCustom.id : activeBuiltIn!.id;
                          const isSelected = tpl.id === activeId;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              data-list-row-btn="true"
                              onClick={() => handleTemplateChange(tpl.id)}
                              className={`group w-full text-left px-3.5 py-2.5 text-sm font-medium flex items-center justify-between gap-3 transition-colors !opacity-100 hover:bg-[#E8F0FE] ${
                                isSelected ? 'bg-[#EFF5FF]' : ''
                              }`}
                            >
                              <span
                                className={`truncate ${
                                  isSelected
                                    ? 'text-[#003865] dark:!text-[#BAE6FD]'
                                    : 'text-[#1E293B] dark:!text-white group-hover:text-[#003865] dark:group-hover:!text-[#BAE6FD]'
                                }`}
                              >
                                {favoriteSet.has(tpl.id) ? `★ ${tpl.title}` : tpl.title}
                              </span>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-[#0F62FE] shrink-0" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F62FE] shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <button
                  id="general-log-favorite-btn"
                  type="button"
                  onClick={() =>
                    onToggleFavoriteGeneralLog(activeCustom ? activeCustom.id : activeBuiltIn!.id)
                  }
                  aria-label={isCurrentFavorite ? 'Desafixar modelo' : 'Fixar modelo'}
                  aria-pressed={isCurrentFavorite}
                  title={isCurrentFavorite ? 'Remover dos fixados' : 'Fixar no topo da lista'}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded border transition-colors shrink-0 ${
                    isCurrentFavorite
                      ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100'
                      : 'border-[#CBD5E1] bg-white text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                  }`}
                >
                  <Star className="w-4 h-4" fill={isCurrentFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{activeDescription}</p>

              {activeCustom && (
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    id="general-log-edit-btn"
                    type="button"
                    onClick={() => {
                      setEditingCustomTemplate(activeCustom);
                      setIsCustomModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Modelo</span>
                  </button>

                  {confirmDeleteId === activeCustom.id ? (
                    <>
                      <button
                        id="general-log-confirm-delete-btn"
                        type="button"
                        onClick={() => {
                          onDeleteCustomGeneralLog(activeCustom.id);
                          setConfirmDeleteId(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        <span>Confirmar exclusão</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded"
                      >
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      id="general-log-delete-btn"
                      type="button"
                      onClick={() => setConfirmDeleteId(activeCustom.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {activeHasGreeting && (
              <div className="pt-3 border-t border-[#E0E4EC]">
                <label
                  htmlFor="general-log-greeting"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Saudação por turno
                </label>
                <select
                  id="general-log-greeting"
                  value={greetingMode}
                  onChange={(e) => {
                    setGreetingMode(e.target.value as 'auto' | GreetingShift);
                    setManualOutput(null);
                  }}
                  className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-2.5 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                >
                  <option value="auto">Automático ({autoGreeting})</option>
                  <option value="Bom dia">Bom dia</option>
                  <option value="Boa tarde">Boa tarde</option>
                  <option value="Boa noite">Boa noite</option>
                </select>
              </div>
            )}

            {activeCustom ? (
              customVariables.length > 0 ? (
                <div className="pt-3 border-t border-[#E0E4EC] space-y-3.5">
                  {customVariables.map((varName) => {
                    const inputId = `custom-var-${varName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                    const currentVal = (customFieldValues[activeCustom.id] || {})[varName] || '';
                    return (
                      <div key={varName}>
                        <label
                          htmlFor={inputId}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          {varName}
                        </label>
                        <input
                          id={inputId}
                          type="text"
                          placeholder={`Informe ${varName}`}
                          value={currentVal}
                          onChange={(e) => updateCustomField(varName, e.target.value)}
                          className="w-full h-9 rounded border border-[#CBD5E1] bg-white px-3 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-3 border-t border-[#E0E4EC] leading-relaxed">
                  Modelo personalizado sem variáveis dinâmicas. Edite o texto para incluir campos
                  com {'{{Campo}}'}, se desejar.
                </p>
              )
            ) : activeBuiltIn!.fields.length > 0 ? (
              <div className="pt-3 border-t border-[#E0E4EC] space-y-3.5">
                {activeBuiltIn!.fields.map((field) => {
                  const inputId = `general-field-${field.key}`;
                  if (field.isDate) {
                    return (
                      <div key={field.key} ref={dateContainerRef} className="relative">
                        <label
                          htmlFor={inputId}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          {field.label}
                        </label>
                        <input
                          id={inputId}
                          type="text"
                          placeholder={field.placeholder}
                          value={values[field.key]}
                          onClick={() => setIsCalendarOpen(true)}
                          onFocus={() => setIsCalendarOpen(true)}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className="w-full h-9 rounded border border-[#CBD5E1] bg-white pl-3 pr-8 text-sm font-mono tabular-nums cursor-pointer focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
                        />
                        <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-[29px]" />
                        {isCalendarOpen && (
                          <MiniCalendarPopover
                            value={values[field.key]}
                            onSelect={(next) => updateField(field.key, next)}
                            onClose={() => setIsCalendarOpen(false)}
                            containerRef={dateContainerRef}
                            align="left"
                          />
                        )}
                      </div>
                    );
                  }

                  if (field.isTextarea) {
                    return (
                      <div key={field.key}>
                        <label
                          htmlFor={inputId}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          {field.label}
                        </label>
                        <textarea
                          id={inputId}
                          rows={3}
                          placeholder={field.placeholder}
                          value={values[field.key]}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className={`w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20 ${
                            field.isMono ? 'font-mono' : ''
                          }`}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key}>
                      <label
                        htmlFor={inputId}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        {field.label}
                      </label>
                      <input
                        id={inputId}
                        type="text"
                        placeholder={field.placeholder}
                        value={values[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className={`w-full h-9 rounded border border-[#CBD5E1] bg-white px-3 text-sm text-[#1E293B] focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20 ${
                          field.isMono ? 'font-mono' : ''
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 pt-3 border-t border-[#E0E4EC] leading-relaxed">
                Este modelo não requer preenchimento adicional. A saudação automática do turno e a
                assinatura corporativa já estão aplicadas no console ao lado.
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerateAndSave}
              className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Gerar e Salvar no Histórico</span>
            </button>
          </section>
        </div>

        {/* Right: Placeholder alert + Dark Log Console */}
        <div className="xl:col-span-7 space-y-3">
          {hasPlaceholderWarning && (
            <div
              role="status"
              data-testid="placeholder-warning-banner"
              className="flex items-start gap-2.5 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:text-amber-100"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 leading-relaxed">
                <p className="font-semibold text-amber-950 dark:text-amber-100">
                  Atenção: há campos ou placeholders em aberto antes da cópia
                </p>
                <p className="text-amber-900 dark:text-amber-200 mt-0.5">{buildWarningDetails()}</p>
              </div>
            </div>
          )}

          <LogConsole
            title="Saída — Logs Gerais"
            actionLabel={activeTitle}
            value={displayOutput}
            onChange={(next) => setManualOutput(next)}
            onCopy={handleCopyConsole}
            highlightPlaceholders
            signatureToIgnore={signature}
          />
        </div>
      </div>

      {isCustomModalOpen && (
        <Suspense fallback={null}>
          <CustomGeneralLogModal
            isOpen={isCustomModalOpen}
            editingTemplate={editingCustomTemplate}
            onSave={(draft) => {
              const saved = onSaveCustomGeneralLog(draft);
              setTemplateId(saved.id);
              setManualOutput(null);
            }}
            onClose={() => setIsCustomModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
