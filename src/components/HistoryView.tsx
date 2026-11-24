import React, { useMemo, useState } from 'react';
import { Copy, Download, Search, Trash2 } from 'lucide-react';
import { LogHistoryEntry } from '../types/sapLogs';

interface HistoryViewProps {
  entries: LogHistoryEntry[];
  onCopyEntry: (entry: LogHistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onBackToHub: () => void;
  onNotify?: (type: 'success' | 'warning' | 'error' | 'info', title: string, description?: string) => void;
}

export function buildHistoryBackupJson(
  entries: LogHistoryEntry[],
  exportedAt: Date = new Date()
): string {
  return JSON.stringify(
    {
      exportedAt: exportedAt.toISOString(),
      totalEntries: entries.length,
      entries,
    },
    null,
    2
  );
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  entries,
  onCopyEntry,
  onDeleteEntry,
  onClearAll,
  onBackToHub,
  onNotify,
}) => {
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<'ALL' | 'ARM' | 'BRM' | 'GERAIS'>('ALL');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    entries.length > 0 ? entries[0].id : null
  );

  const filtered = useMemo(() => {
    return entries.filter((item) => {
      if (areaFilter !== 'ALL' && item.area !== areaFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        item.chamado.toLowerCase().includes(q) ||
        item.solicitante.toLowerCase().includes(q) ||
        item.actionLabel.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });
  }, [entries, areaFilter, query]);

  const activeEntry =
    filtered.find((e) => e.id === selectedId) || (filtered.length > 0 ? filtered[0] : null);

  const handleExportHistory = () => {
    if (entries.length === 0) return;
    const now = new Date();
    const json = buildHistoryBackupJson(entries, now);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sap-basis-historico-${now.toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify?.(
      'success',
      'Histórico exportado',
      `${entries.length} ${entries.length === 1 ? 'registro salvo' : 'registros salvos'} no arquivo de backup.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Painel / Histórico de Logs</p>
          <h1 className="text-2xl font-semibold text-[#003865] mt-1">
            Histórico de Logs Gerados
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="export-history-btn"
            type="button"
            onClick={handleExportHistory}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-[#EFF5FF] hover:border-[#0F62FE] rounded disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#0F62FE]" />
            <span>Exportar Histórico</span>
          </button>

          {entries.length > 0 &&
            (confirmClearAll ? (
              <div className="inline-flex items-center gap-1.5 rounded border border-[#DA1E28]/40 bg-red-50 px-2 py-1">
                <span className="text-xs font-medium text-[#DA1E28] whitespace-nowrap">
                  Limpar todos ({entries.length})?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClearAll(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#DA1E28] hover:bg-red-700 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-[#CBD5E1] rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#DA1E28] bg-white border border-[#DA1E28] hover:bg-[#DA1E28] hover:text-white rounded transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            ))}
          <button
            type="button"
            onClick={onBackToHub}
            className="px-4 py-2 text-xs font-semibold text-[#003865] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E0E4EC] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por chamado, solicitante ou conteúdo..."
            aria-label="Filtrar histórico de logs"
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-[#CBD5E1] rounded focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
          {(['ALL', 'ARM', 'BRM', 'GERAIS'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setAreaFilter(tab)}
              aria-pressed={areaFilter === tab}
              className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 ${
                areaFilter === tab
                  ? 'bg-white text-[#003865] shadow-xs'
                  : 'text-slate-600 hover:bg-white/70 hover:text-[#003865]'
              }`}
            >
              {tab === 'ALL' ? 'Todos' : tab === 'GERAIS' ? 'Logs Gerais' : tab}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E0E4EC] rounded-lg p-12 text-center">
          <h2 className="text-base font-semibold text-[#1E293B]">
            Nenhum log registrado no histórico
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Os logs gerados e copiados nas telas de ARM, BRM e Logs Gerais ficam armazenados aqui para consulta rápida.
          </p>
          <button
            type="button"
            onClick={onBackToHub}
            className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors"
          >
            Ir para o Painel de Geração
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white border border-[#E0E4EC] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E0E4EC] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Registros ({filtered.length})
              </span>
            </div>
            <div className="divide-y divide-[#E0E4EC] max-h-[480px] overflow-auto">
              {filtered.map((entry) => {
                const isActive = activeEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      isActive ? 'bg-[#F0F4FF]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      data-list-row-btn="true"
                      onClick={() => setSelectedId(entry.id)}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#003865]">{entry.area}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[#1E293B]">{entry.chamado || 'Sem chamado'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {new Date(entry.createdAt).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1E293B] truncate mt-0.5">
                        {entry.actionLabel} — {entry.solicitante || 'Não informado'}
                      </p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onCopyEntry(entry)}
                        aria-label={`Copiar log ${entry.chamado}`}
                        className="p-1.5 text-slate-500 hover:text-[#0F62FE] rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        aria-label={`Remover log ${entry.chamado}`}
                        className="p-1.5 text-slate-400 hover:text-[#DA1E28] rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] rounded-lg overflow-hidden">
            {activeEntry && (
              <>
                <div className="px-4 py-3 border-b border-slate-800 bg-[#0B1120] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {activeEntry.moduleLabel} — {activeEntry.actionLabel}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Chamado: {activeEntry.chamado || '-'} · Solicitante: {activeEntry.solicitante || '-'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopyEntry(activeEntry)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F62FE] hover:bg-[#0043CE] rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                </div>
                <pre className="p-4 text-[12.5px] font-mono leading-[1.6] text-slate-100 whitespace-pre-wrap break-words max-h-[440px] overflow-auto">
                  {activeEntry.content}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
