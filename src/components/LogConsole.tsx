import React, { useState } from 'react';
import { Check, Copy, Download, Edit3, Eye } from 'lucide-react';

interface LogConsoleProps {
  title: string;
  value: string;
  onChange: (next: string) => void;
  onCopy: () => void;
  emptyHint?: string;
  actionLabel?: string;
  highlightPlaceholders?: boolean;
  signatureToIgnore?: string;
}

const PLACEHOLDER_SPLIT_REGEX = /(\b(?:XXXXX|XXXX|xxxxxx|NOME1|NOME2|NOME3|NOME)\b)/;
const PLACEHOLDER_EXACT_REGEX = /^(?:XXXXX|XXXX|xxxxxx|NOME1|NOME2|NOME3|NOME)$/;

export const LogConsole: React.FC<LogConsoleProps> = ({
  title,
  value,
  onChange,
  onCopy,
  emptyHint = 'Preencha os campos obrigatórios e selecione um botão de geração para visualizar o log.',
  actionLabel,
  highlightPlaceholders = false,
  signatureToIgnore,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const lines = value ? value.split('\n') : [];
  const charCount = value.length;
  const lineCount = lines.length;

  const sigTrimmed = signatureToIgnore?.trim() || '';
  const bodyEndOffset =
    highlightPlaceholders && sigTrimmed && value.endsWith(sigTrimmed)
      ? value.length - sigTrimmed.length
      : value.length;

  const renderLineContent = (line: string, lineStartOffset: number) => {
    if (line === '') return '\u00A0';
    if (!highlightPlaceholders || lineStartOffset >= bodyEndOffset) {
      return line;
    }

    const parts = line.split(PLACEHOLDER_SPLIT_REGEX);
    if (parts.length === 1) return line;

    return parts.map((part, idx) =>
      PLACEHOLDER_EXACT_REGEX.test(part) ? (
        <mark
          key={idx}
          className="bg-amber-400/25 text-amber-200 underline decoration-amber-400 rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  };

  let runningOffset = 0;

  const handleCopyClick = async () => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback handled by parent toast/history if clipboard API is restricted
    }
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!value.trim()) return;
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sap-basis-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col rounded-lg border border-[#1E293B] bg-[#0F172A] text-[#F8FAFC] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 bg-[#0B1120]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold tracking-wide text-slate-200 truncate">
            {title}
          </span>
          {actionLabel && (
            <>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-slate-400 truncate">{actionLabel}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            disabled={!value}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
            aria-label={isEditing ? 'Visualizar linhas do log' : 'Editar texto do log'}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Visualizar' : 'Editar'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!value}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
            aria-label="Baixar log em formato TXT"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={handleCopyClick}
            disabled={!value}
            data-testid="console-copy-btn"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0 ${
              copied
                ? 'bg-[#198038] text-white'
                : 'bg-[#0F62FE] hover:bg-[#0043CE] text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      <div className="relative min-h-[260px] max-h-[420px] overflow-auto">
        {!value ? (
          <div className="flex items-center justify-center h-[260px] px-6 text-center">
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">{emptyHint}</p>
          </div>
        ) : isEditing ? (
          <textarea
            aria-label="Editor do log gerado"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-[320px] p-4 bg-[#0F172A] text-slate-100 font-mono text-[13px] leading-[1.6] focus:outline-none resize-y"
          />
        ) : (
          <div className="py-3 px-2 font-mono text-[12.5px] leading-[1.6]" data-testid="log-output">
            {lines.map((line, index) => {
              const lineOffset = runningOffset;
              runningOffset += line.length + 1;
              return (
                <div
                  key={index}
                  className="flex items-start px-2 hover:bg-slate-800/40 rounded-sm"
                >
                  <span className="w-9 pr-3 text-right select-none text-slate-500 text-[11px] leading-[1.75] tabular-nums shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-slate-100 whitespace-pre-wrap break-words flex-1">
                    {renderLineContent(line, lineOffset)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-[#0B1120] text-[11px] text-slate-400 tabular-nums">
        <div className="flex items-center gap-2">
          <span>{lineCount} linhas</span>
          <span aria-hidden="true">·</span>
          <span>{charCount} caracteres</span>
        </div>
        <span>UTF-8</span>
      </div>
    </div>
  );
};
