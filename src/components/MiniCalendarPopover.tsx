import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarPopoverProps {
  value: string;
  onSelect: (formattedDate: string) => void;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  align?: 'left' | 'right';
  fallbackMonthValue?: string;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function parseSapDate(raw: string): Date | null {
  const trimmed = raw.trim();
  const match = /^(\d{2})[./-](\d{2})[./-](\d{4})$/.exec(trimmed);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatSapDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export const MiniCalendarPopover: React.FC<MiniCalendarPopoverProps> = ({
  value,
  onSelect,
  onClose,
  containerRef,
  align = 'left',
  fallbackMonthValue,
}) => {
  const parsedValue = parseSapDate(value);
  const initialDate =
    parsedValue || (fallbackMonthValue ? parseSapDate(fallbackMonthValue) : null) || new Date();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, onClose]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d });
  }

  return (
    <div
      role="dialog"
      aria-label="Selecionar data"
      className={`absolute top-full mt-1.5 z-40 w-[236px] rounded-lg border border-[#CBD5E1] bg-white p-2.5 shadow-lg ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      <div className="flex items-center justify-between gap-1 pb-2 mb-1.5 border-b border-[#E0E4EC]">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Mês anterior"
          className="p-1 rounded text-slate-600 hover:bg-slate-100 hover:text-[#003865] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-semibold text-[#003865] select-none">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
          className="p-1 rounded text-slate-600 hover:bg-slate-100 hover:text-[#003865] transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {WEEKDAYS.map((wd, idx) => (
          <span
            key={idx}
            className="text-[10px] font-semibold text-slate-400 py-0.5 select-none"
          >
            {wd}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return <span key={`empty-${idx}`} className="h-7" />;
          }

          const dayNum = cell.day;
          const isSelected =
            parsedValue !== null &&
            parsedValue.getFullYear() === viewYear &&
            parsedValue.getMonth() === viewMonth &&
            parsedValue.getDate() === dayNum;

          const isToday =
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === dayNum;

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => {
                onSelect(formatSapDate(new Date(viewYear, viewMonth, dayNum)));
                onClose();
              }}
              className={`h-7 w-full rounded text-xs tabular-nums transition-colors ${
                isSelected
                  ? 'bg-[#0F62FE] text-white font-semibold'
                  : isToday
                    ? 'border border-[#0F62FE] text-[#0F62FE] font-semibold hover:bg-[#EFF5FF]'
                    : 'text-[#1E293B] hover:bg-slate-100'
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-[#E0E4EC]">
        <button
          type="button"
          onClick={() => {
            onSelect('');
            onClose();
          }}
          className="text-[11px] font-medium text-slate-500 hover:text-[#DA1E28] px-1.5 py-0.5 rounded transition-colors"
        >
          Limpar
        </button>

        <button
          type="button"
          onClick={() => {
            onSelect(formatSapDate(new Date()));
            onClose();
          }}
          className="text-[11px] font-semibold text-[#0F62FE] hover:underline px-1.5 py-0.5 rounded"
        >
          Hoje
        </button>
      </div>
    </div>
  );
};
