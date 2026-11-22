import { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  AppRoute,
  CustomGeneralLogTemplate,
  GeneralLogId,
  LogHistoryEntry,
} from './types/sapLogs';
import { DEFAULT_SIGNATURE } from './utils/logGenerators';
import { HubView } from './components/HubView';
import { ArmGrcView } from './components/ArmGrcView';
import { BrmView } from './components/BrmView';
import {
  ArmLegadosView,
  ArmMultiploView,
  EncerramentoStandaloneView,
} from './components/ArmExtraViews';
import { LogsGeraisView } from './components/LogsGeraisView';
import { HistoryView } from './components/HistoryView';
import { SignatureModal } from './components/SignatureModal';
import { Toast, ToastMessage } from './components/Toast';

const SIGNATURE_STORAGE_KEY = 'sap_basis_signature_v1';
const HISTORY_STORAGE_KEY = 'sap_basis_log_history_v1';
const FAVORITE_GENERAL_LOGS_KEY = 'sap_basis_general_favorites_v1';
const CUSTOM_GENERAL_LOGS_KEY = 'sap_basis_custom_general_logs_v1';

const PREVIOUS_DEFAULT_SIGNATURE = `Você receberá uma Pesquisa de Satisfação em seu e-mail quando este chamado for encerrado. Sua avaliação é fundamental para que possamos aprimorar nosso atendimento.
Adriano Pascoa| Application Management Services SAP Basis

Atenciosamente,`;

export default function App() {
  const [route, setRoute] = useState<AppRoute>('hub');
  const [selectedGeneralLogId, setSelectedGeneralLogId] =
    useState<GeneralLogId>('envio-brm-grc');
  const [signature, setSignature] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem(SIGNATURE_STORAGE_KEY);
      if (!saved || saved === PREVIOUS_DEFAULT_SIGNATURE) {
        return DEFAULT_SIGNATURE;
      }
      return saved;
    } catch {
      return DEFAULT_SIGNATURE;
    }
  });

  const [history, setHistory] = useState<LogHistoryEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LogHistoryEntry[]) : [];
    } catch {
      return [];
    }
  });

  const [favoriteGeneralIds, setFavoriteGeneralIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITE_GENERAL_LOGS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [customGeneralTemplates, setCustomGeneralTemplates] = useState<CustomGeneralLogTemplate[]>(
    () => {
      try {
        const raw = window.localStorage.getItem(CUSTOM_GENERAL_LOGS_KEY);
        return raw ? (JSON.parse(raw) as CustomGeneralLogTemplate[]) : [];
      } catch {
        return [];
      }
    }
  );

  const [pendingOpenCreateCustom, setPendingOpenCreateCustom] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIGNATURE_STORAGE_KEY, signature);
    } catch {
      // Ignore storage quota errors
    }
  }, [signature]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITE_GENERAL_LOGS_KEY, JSON.stringify(favoriteGeneralIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteGeneralIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CUSTOM_GENERAL_LOGS_KEY,
        JSON.stringify(customGeneralTemplates)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [customGeneralTemplates]);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      setToast({
        id: `${Date.now()}`,
        type,
        title,
        description,
      });
    },
    []
  );

  const handleSaveSignature = (next: string) => {
    setSignature(next);
    notify('success', 'Assinatura salva', 'Atualizada para todos os próximos logs e e-mails.');
  };

  const handleToggleFavoriteGeneralLog = useCallback((id: GeneralLogId) => {
    setFavoriteGeneralIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleSaveCustomGeneralLog = useCallback(
    (draft: {
      id?: string;
      title: string;
      description: string;
      hasGreeting: boolean;
      bodyTemplate: string;
    }): CustomGeneralLogTemplate => {
      const saved: CustomGeneralLogTemplate = {
        id: draft.id || `custom-${Date.now()}`,
        title: draft.title,
        description: draft.description,
        hasGreeting: draft.hasGreeting,
        bodyTemplate: draft.bodyTemplate,
        updatedAt: new Date().toISOString(),
      };

      setCustomGeneralTemplates((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        return exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [...prev, saved];
      });
      setSelectedGeneralLogId(saved.id);
      notify(
        'success',
        draft.id ? 'Modelo atualizado' : 'Modelo personalizado criado',
        saved.title
      );
      return saved;
    },
    [notify]
  );

  const handleDeleteCustomGeneralLog = useCallback(
    (id: string) => {
      setCustomGeneralTemplates((prev) => prev.filter((item) => item.id !== id));
      setFavoriteGeneralIds((prev) => prev.filter((item) => item !== id));
      setSelectedGeneralLogId((prev) => (prev === id ? 'envio-brm-grc' : prev));
      notify('info', 'Modelo removido', 'O modelo personalizado foi excluído.');
    },
    [notify]
  );

  const handleLogGenerated = useCallback(
    (payload: {
      area: 'ARM' | 'BRM' | 'GERAIS';
      moduleLabel: string;
      actionLabel: string;
      chamado: string;
      solicitante: string;
      content: string;
    }) => {
      const entry: LogHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 40));
    },
    []
  );

  const handleCopyEntry = async (entry: LogHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.content);
    } catch {
      // Clipboard fallback ignored cleanly
    }
    notify('success', 'Log copiado', `${entry.actionLabel} (${entry.chamado || 'Registro'})`);
  };

  const isArmActive =
    route === 'arm-grc' ||
    route === 'arm-legados' ||
    route === 'arm-multiplo' ||
    route === 'arm-encerramento';
  const isBrmActive =
    route === 'brm-manutencao' || route === 'brm-legados' || route === 'brm-encerramento';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-[#1E293B]">
      {/* Top Bar Contract: 1 row, 3 zones separated by gap-8 */}
      <header className="md:sticky md:top-0 z-30 bg-white border-b border-[#E0E4EC]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand logo */}
          <button
            type="button"
            onClick={() => setRoute('hub')}
            aria-label="SAP Basis - Logs"
            className="inline-flex items-center shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F62FE]"
          >
            <img
              src="/assets/aistudio/SAP_Logo_-_Colored_-_32x32_3644d71f.png"
              alt="SAP"
              className="h-8 w-8 object-contain"
            />
          </button>

          {/* Zone 2: 5 concise single-line nav links + Extrator SU53 */}
          <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={() => setRoute('hub')}
              aria-current={route === 'hub' ? 'page' : undefined}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-t border-b-2 whitespace-nowrap shrink-0 ${
                route === 'hub'
                  ? 'border-[#0F62FE] text-[#003865] font-semibold bg-[#EFF5FF]/70'
                  : 'border-transparent text-slate-600 hover:text-[#003865] hover:bg-[#EFF5FF] hover:border-[#0F62FE]/60'
              }`}
            >
              Painel
            </button>
            <button
              type="button"
              onClick={() => setRoute('arm-grc')}
              aria-current={isArmActive ? 'page' : undefined}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-t border-b-2 whitespace-nowrap shrink-0 ${
                isArmActive
                  ? 'border-[#0F62FE] text-[#003865] font-semibold bg-[#EFF5FF]/70'
                  : 'border-transparent text-slate-600 hover:text-[#003865] hover:bg-[#EFF5FF] hover:border-[#0F62FE]/60'
              }`}
            >
              ARM
            </button>
            <button
              type="button"
              onClick={() => setRoute('brm-manutencao')}
              aria-current={isBrmActive ? 'page' : undefined}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-t border-b-2 whitespace-nowrap shrink-0 ${
                isBrmActive
                  ? 'border-[#0F62FE] text-[#003865] font-semibold bg-[#EFF5FF]/70'
                  : 'border-transparent text-slate-600 hover:text-[#003865] hover:bg-[#EFF5FF] hover:border-[#0F62FE]/60'
              }`}
            >
              BRM
            </button>
            <button
              type="button"
              onClick={() => setRoute('logs-gerais')}
              aria-current={route === 'logs-gerais' ? 'page' : undefined}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-t border-b-2 whitespace-nowrap shrink-0 ${
                route === 'logs-gerais'
                  ? 'border-[#0F62FE] text-[#003865] font-semibold bg-[#EFF5FF]/70'
                  : 'border-transparent text-slate-600 hover:text-[#003865] hover:bg-[#EFF5FF] hover:border-[#0F62FE]/60'
              }`}
            >
              Logs Gerais
            </button>
            <button
              type="button"
              onClick={() => setRoute('historico')}
              aria-current={route === 'historico' ? 'page' : undefined}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-t border-b-2 whitespace-nowrap shrink-0 ${
                route === 'historico'
                  ? 'border-[#0F62FE] text-[#003865] font-semibold bg-[#EFF5FF]/70'
                  : 'border-transparent text-slate-600 hover:text-[#003865] hover:bg-[#EFF5FF] hover:border-[#0F62FE]/60'
              }`}
            >
              Histórico
            </button>
            <a
              href="https://extrator-su53.adrianoiuris.workers.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#003865] bg-slate-50 border border-[#CBD5E1] hover:bg-[#EFF5FF] hover:border-[#0F62FE] hover:text-[#0F62FE] rounded whitespace-nowrap shrink-0"
            >
              <span>Extrator SU53</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#003865] hover:bg-[#0F62FE] rounded whitespace-nowrap shrink-0"
            >
              Assinatura E-mail
            </button>
          </div>
        </div>

        {/* Mobile navigation strip */}
        <nav
          aria-label="Navegação móvel"
          className="flex md:hidden items-center gap-1 px-4 py-2 border-t border-[#E0E4EC] overflow-x-auto bg-[#F8FAFC]"
        >
          {[
            { id: 'hub' as AppRoute, label: 'Painel', active: route === 'hub' },
            { id: 'arm-grc' as AppRoute, label: 'ARM', active: isArmActive },
            { id: 'brm-manutencao' as AppRoute, label: 'BRM', active: isBrmActive },
            { id: 'logs-gerais' as AppRoute, label: 'Logs Gerais', active: route === 'logs-gerais' },
            { id: 'historico' as AppRoute, label: 'Histórico', active: route === 'historico' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoute(item.id)}
              aria-current={item.active ? 'page' : undefined}
              className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 ${
                item.active
                  ? 'bg-[#0F62FE] text-white'
                  : 'text-slate-600 hover:bg-[#EFF5FF] hover:text-[#003865]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <a
            href="https://extrator-su53.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-[#EFF5FF] hover:border-[#0F62FE] rounded whitespace-nowrap shrink-0"
          >
            <span>Extrator SU53</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div key={route} className="page-transition-enter">
        {route === 'hub' && (
          <HubView
            signature={signature}
            onSaveSignature={handleSaveSignature}
            onNavigate={setRoute}
            onOpenGeneralLog={(id) => {
              setSelectedGeneralLogId(id);
              setRoute('logs-gerais');
            }}
            onCreateCustomGeneralLog={() => {
              setPendingOpenCreateCustom(true);
              setRoute('logs-gerais');
            }}
            favoriteGeneralIds={favoriteGeneralIds}
            customGeneralTemplates={customGeneralTemplates}
            onToggleFavoriteGeneralLog={handleToggleFavoriteGeneralLog}
            recentLogs={history}
            onCopyLog={handleCopyEntry}
          />
        )}

        {route === 'arm-grc' && (
          <ArmGrcView
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'arm-legados' && (
          <ArmLegadosView
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'arm-multiplo' && (
          <ArmMultiploView
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'arm-encerramento' && (
          <EncerramentoStandaloneView
            modulo="ARM"
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'brm-manutencao' && (
          <BrmView
            mode="manutencao"
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'brm-legados' && (
          <BrmView
            mode="legados"
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'brm-encerramento' && (
          <EncerramentoStandaloneView
            modulo="BRM"
            signature={signature}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'logs-gerais' && (
          <LogsGeraisView
            initialTemplateId={selectedGeneralLogId}
            signature={signature}
            customGeneralTemplates={customGeneralTemplates}
            favoriteGeneralIds={favoriteGeneralIds}
            pendingOpenCreateCustom={pendingOpenCreateCustom}
            onConsumePendingOpenCreateCustom={() => setPendingOpenCreateCustom(false)}
            onToggleFavoriteGeneralLog={handleToggleFavoriteGeneralLog}
            onSaveCustomGeneralLog={handleSaveCustomGeneralLog}
            onDeleteCustomGeneralLog={handleDeleteCustomGeneralLog}
            onLogGenerated={handleLogGenerated}
            onNotify={notify}
            onCloseToHub={() => setRoute('hub')}
          />
        )}

        {route === 'historico' && (
          <HistoryView
            entries={history}
            onCopyEntry={handleCopyEntry}
            onDeleteEntry={(id) =>
              setHistory((prev) => prev.filter((item) => item.id !== id))
            }
            onClearAll={() => {
              setHistory([]);
              notify('info', 'Histórico limpo');
            }}
            onBackToHub={() => setRoute('hub')}
            onNotify={notify}
          />
        )}
        </div>
      </main>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        signature={signature}
        onSave={handleSaveSignature}
        onClose={() => setIsSignatureModalOpen(false)}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
