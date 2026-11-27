import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ExternalLink, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import {
  AppRoute,
  AuthRoute,
  CustomGeneralLogTemplate,
  GeneralLogId,
  ImportantLinkItem,
  LogHistoryEntry,
} from './types/sapLogs';
import { DEFAULT_SIGNATURE } from './utils/logGenerators';
import {
  parseStoredCustomTemplates,
  parseStoredHistory,
  parseStoredImportantLinks,
  parseStoredStringArray,
  sanitizeHttpUrl,
} from './utils/storageValidation';
import { clearAllDrafts } from './utils/draftStorage';
import { copyTextToClipboard } from './utils/clipboard';
import { useTheme } from './hooks/useTheme';
import { HubView } from './components/HubView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ThemeToggle } from './components/ThemeToggle';
import { Toast, ToastAction, ToastMessage } from './components/Toast';

const ArmGrcView = lazy(() =>
  import('./components/ArmGrcView').then((m) => ({ default: m.ArmGrcView }))
);
const BrmView = lazy(() =>
  import('./components/BrmView').then((m) => ({ default: m.BrmView }))
);
const ArmLegadosView = lazy(() =>
  import('./components/ArmExtraViews').then((m) => ({ default: m.ArmLegadosView }))
);
const ArmMultiploView = lazy(() =>
  import('./components/ArmExtraViews').then((m) => ({ default: m.ArmMultiploView }))
);
const EncerramentoStandaloneView = lazy(() =>
  import('./components/ArmExtraViews').then((m) => ({ default: m.EncerramentoStandaloneView }))
);
const LogsGeraisView = lazy(() =>
  import('./components/LogsGeraisView').then((m) => ({ default: m.LogsGeraisView }))
);
const HistoryView = lazy(() =>
  import('./components/HistoryView').then((m) => ({ default: m.HistoryView }))
);
const SignatureModal = lazy(() =>
  import('./components/SignatureModal').then((m) => ({ default: m.SignatureModal }))
);
const AuthFlow = lazy(() =>
  import('./components/auth/AuthFlow').then((m) => ({ default: m.AuthFlow }))
);

const SIGNATURE_STORAGE_KEY = 'sap_basis_signature_v1';
const HISTORY_STORAGE_KEY = 'sap_basis_log_history_v1';
const FAVORITE_GENERAL_LOGS_KEY = 'sap_basis_general_favorites_v1';
const CUSTOM_GENERAL_LOGS_KEY = 'sap_basis_custom_general_logs_v1';
const CUSTOM_IMPORTANT_LINKS_KEY = 'sap_basis_custom_important_links_v1';

const PREVIOUS_DEFAULT_SIGNATURE = `Você receberá uma Pesquisa de Satisfação em seu e-mail quando este chamado for encerrado. Sua avaliação é fundamental para que possamos aprimorar nosso atendimento.
Adriano Pascoa| Application Management Services SAP Basis

Atenciosamente,`;

function isAuthRoute(r: AppRoute): boolean {
  return (
    r === 'login' ||
    r === 'cadastro' ||
    r === 'recuperar-senha' ||
    r === 'email-enviado' ||
    r === 'redefinir-senha'
  );
}

function parseRouteFromLocation(
  location: Pick<Location, 'pathname' | 'hash'>,
  hasSession: boolean
): AppRoute {
  const rawHash = location.hash ? location.hash.replace(/^#/, '') : '';
  const isRouteHash =
    rawHash.startsWith('/') ||
    [
      'login',
      'cadastro',
      'recuperar-senha',
      'email-enviado',
      'redefinir-senha',
      'hub',
      'arm-grc',
      'arm-legados',
      'arm-multiplo',
      'arm-encerramento',
      'brm-manutencao',
      'brm-legados',
      'brm-encerramento',
      'logs-gerais',
      'historico',
    ].some((r) => rawHash.startsWith(r));

  const candidatePath =
    rawHash && isRouteHash
      ? rawHash.startsWith('/')
        ? rawHash
        : `/${rawHash}`
      : location.pathname;
  const clean = candidatePath.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/cadastro' || clean === '/register' || clean === '/auth/cadastro') return 'cadastro';
  if (clean === '/recuperar-senha' || clean === '/forgot-password' || clean === '/auth/recuperar-senha')
    return 'recuperar-senha';
  if (clean === '/email-enviado' || clean === '/auth/email-enviado') return 'email-enviado';
  if (clean === '/redefinir-senha' || clean === '/reset-password' || clean === '/auth/redefinir-senha')
    return 'redefinir-senha';
  if (clean === '/login' || clean === '/auth/login') {
    return hasSession ? 'hub' : 'login';
  }

  // Rota raiz '/': se tem sessão vai para o hub, senão login
  if (clean === '/') {
    return hasSession ? 'hub' : 'login';
  }

  // Rotas internas protegidas: sem sessão redireciona para login
  if (!hasSession) {
    return 'login';
  }

  if (clean === '/arm-grc') return 'arm-grc';
  if (clean === '/arm-legados') return 'arm-legados';
  if (clean === '/arm-multiplo') return 'arm-multiplo';
  if (clean === '/arm-encerramento') return 'arm-encerramento';
  if (clean === '/brm-manutencao') return 'brm-manutencao';
  if (clean === '/brm-legados') return 'brm-legados';
  if (clean === '/brm-encerramento') return 'brm-encerramento';
  if (clean === '/logs-gerais') return 'logs-gerais';
  if (clean === '/historico') return 'historico';
  return 'hub';
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      return parseRouteFromLocation(window.location, false);
    }
    return 'login';
  });
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
      return parseStoredHistory(raw);
    } catch {
      return [];
    }
  });

  const [favoriteGeneralIds, setFavoriteGeneralIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITE_GENERAL_LOGS_KEY);
      return parseStoredStringArray(raw);
    } catch {
      return [];
    }
  });

  const [customGeneralTemplates, setCustomGeneralTemplates] = useState<CustomGeneralLogTemplate[]>(
    () => {
      try {
        const raw = window.localStorage.getItem(CUSTOM_GENERAL_LOGS_KEY);
        return parseStoredCustomTemplates(raw);
      } catch {
        return [];
      }
    }
  );

  const [customImportantLinks, setCustomImportantLinks] = useState<ImportantLinkItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOM_IMPORTANT_LINKS_KEY);
      return parseStoredImportantLinks(raw);
    } catch {
      return [];
    }
  });

  const [pendingOpenCreateCustom, setPendingOpenCreateCustom] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    // 1. Obter sessão inicial do Supabase
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Erro ao verificar sessão inicial:', error);
      }
      setSession(initialSession);
      setAuthLoading(false);

      const hasSession = !!initialSession;
      const target = parseRouteFromLocation(window.location, hasSession);
      setRoute(target);
    });

    // 2. Ouvir alterações de sessão em tempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);

      // Tratamento do evento PASSWORD_RECOVERY enviado por e-mail
      if (event === 'PASSWORD_RECOVERY') {
        setRoute('redefinir-senha');
        return;
      }

      if (event === 'SIGNED_IN') {
        setRoute((prev) => {
          if (prev === 'login' || prev === 'cadastro') {
            return 'hub';
          }
          if (prev === 'redefinir-senha') {
            return 'redefinir-senha';
          }
          return isAuthRoute(prev) ? 'hub' : prev;
        });
        return;
      }

      if (event === 'SIGNED_OUT') {
        setRoute('login');
        return;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  useEffect(() => {
    if (authLoading) return;

    const isAuth = isAuthRoute(route);
    const targetHash = isAuth ? `#/${route}` : route === 'hub' ? '' : `#/${route}`;
    const targetUrl = targetHash ? `/${targetHash}` : '/';
    const currentUrl = `${window.location.pathname}${window.location.hash}`;
    if (currentUrl !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  }, [route, authLoading]);

  useEffect(() => {
    const handleLocationChange = () => {
      const hasSession = !!session;
      const matched = parseRouteFromLocation(window.location, hasSession);
      setRoute(matched);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [session]);

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      if (!isAuthRoute(route)) {
        setRoute('login');
      }
    } else {
      if (route === 'login' || route === 'cadastro') {
        setRoute('hub');
      }
    }
  }, [session, route, authLoading]);

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

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CUSTOM_IMPORTANT_LINKS_KEY,
        JSON.stringify(customImportantLinks)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [customImportantLinks]);

  const notify = useCallback(
    (
      type: ToastMessage['type'],
      title: string,
      description?: string,
      action?: ToastAction
    ) => {
      setToast({
        id: `${Date.now()}`,
        type,
        title,
        description,
        action,
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

  const handleAddImportantLink = useCallback(
    (draft: { label: string; url: string }) => {
      const safeUrl = sanitizeHttpUrl(draft.url);
      const cleanLabel = draft.label.trim();
      if (!safeUrl || !cleanLabel) return;

      const created: ImportantLinkItem = {
        id: `custom-link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: cleanLabel,
        url: safeUrl,
        isCustom: true,
      };
      setCustomImportantLinks((prev) => [...prev, created]);
      notify('success', 'Link adicionado', created.label);
    },
    [notify]
  );

  const handleDeleteImportantLink = useCallback(
    (id: string) => {
      const removed = customImportantLinks.find((item) => item.id === id);
      if (!removed) return;
      setCustomImportantLinks((prev) => prev.filter((item) => item.id !== id));
      notify('info', 'Link removido', removed.label, {
        label: 'Desfazer',
        onClick: () => {
          setCustomImportantLinks((prev) =>
            prev.some((item) => item.id === removed.id) ? prev : [...prev, removed]
          );
        },
      });
    },
    [customImportantLinks, notify]
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
    await copyTextToClipboard(entry.content);
    notify('success', 'Log copiado', `${entry.actionLabel} (${entry.chamado || 'Registro'})`);
  };

  const handleDeleteHistoryEntry = useCallback(
    (id: string) => {
      const removed = history.find((item) => item.id === id);
      if (!removed) return;
      setHistory((prev) => prev.filter((item) => item.id !== id));
      notify('info', 'Registro removido do histórico', removed.chamado || removed.actionLabel, {
        label: 'Desfazer',
        onClick: () => {
          setHistory((prev) =>
            prev.some((item) => item.id === removed.id)
              ? prev
              : [removed, ...prev].slice(0, 40)
          );
        },
      });
    },
    [history, notify]
  );

  const handleClearAllHistory = useCallback(() => {
    if (history.length === 0) return;
    const backup = [...history];
    setHistory([]);
    notify('info', 'Histórico limpo', `${backup.length} registros removidos.`, {
      label: 'Desfazer',
      onClick: () => {
        setHistory(backup);
      },
    });
  }, [history, notify]);

  const handleLoginSuccess = useCallback(
    (email: string) => {
      setRoute('hub');
      notify('success', 'Login realizado!', `Bem-vindo de volta, ${email}`);
    },
    [notify]
  );

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
    clearAllDrafts();
    setSession(null);
    setRoute('login');
    notify('info', 'Sessão encerrada', 'Você saiu da sua conta.');
  }, [notify]);

  const isArmActive =
    route === 'arm-grc' ||
    route === 'arm-legados' ||
    route === 'arm-multiplo' ||
    route === 'arm-encerramento';
  const isBrmActive =
    route === 'brm-manutencao' || route === 'brm-legados' || route === 'brm-encerramento';

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-medium text-slate-600">Verificando sessão...</span>
      </div>
    );
  }

  const shouldRenderAuth = !session || (isAuthRoute(route) && route === 'redefinir-senha');

  if (shouldRenderAuth) {
    const currentAuthRoute = isAuthRoute(route) ? (route as AuthRoute) : 'login';
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-500 text-sm">
              Carregando autenticação...
            </div>
          }
        >
          <AuthFlow
            currentRoute={currentAuthRoute}
            onNavigate={(nextRoute) => setRoute(nextRoute)}
            onLoginSuccess={handleLoginSuccess}
            onNotify={notify}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </Suspense>
        <Toast toast={toast} onDismiss={() => setToast(null)} />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-[#1E293B]">
      {/* Top Bar Contract: 1 row, 3 zones separated by gap-8 */}
      <header className="md:sticky md:top-0 z-30 bg-white border-b border-[#E0E4EC]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-6 lg:gap-8">
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
              href="https://extrator-su53.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#003865] bg-slate-50 border border-[#CBD5E1] hover:bg-[#EFF5FF] hover:border-[#0F62FE] hover:text-[#0F62FE] rounded whitespace-nowrap shrink-0"
            >
              <span>Extrator SU53</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </nav>

          {/* Zone 3: Actions (Tema + Instalar App + Assinatura E-mail + Sair) */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#003865] hover:bg-[#0F62FE] rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              Assinatura E-mail
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Sair da conta e voltar para o login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
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
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 text-rose-600 bg-rose-50 hover:bg-rose-100"
          >
            <LogOut className="w-3 h-3" />
            <span>Sair</span>
          </button>
          <a
            href="https://extrator-su53.vercel.app/"
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
          <Suspense
            fallback={
              <div className="bg-white border border-[#E0E4EC] rounded-lg p-10 text-center text-xs text-slate-500">
                Carregando módulo...
              </div>
            }
          >
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
                customImportantLinks={customImportantLinks}
                onAddImportantLink={handleAddImportantLink}
                onDeleteImportantLink={handleDeleteImportantLink}
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
                onDeleteEntry={handleDeleteHistoryEntry}
                onClearAll={handleClearAllHistory}
                onBackToHub={() => setRoute('hub')}
                onNotify={notify}
              />
            )}
          </Suspense>
        </div>
      </main>

      {isSignatureModalOpen && (
        <Suspense fallback={null}>
          <SignatureModal
            isOpen={isSignatureModalOpen}
            signature={signature}
            onSave={handleSaveSignature}
            onClose={() => setIsSignatureModalOpen(false)}
          />
        </Suspense>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <OfflineIndicator />
    </div>
  );
}
