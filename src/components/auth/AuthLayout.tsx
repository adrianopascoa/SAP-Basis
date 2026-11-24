import React from 'react';
import { ThemeMode } from '../../hooks/useTheme';
import { ThemeToggle } from '../ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, theme, onToggleTheme }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-50 text-slate-800 antialiased p-4 sm:p-6 lg:p-8 selection:bg-blue-100 selection:text-blue-900">
      {/* Barra superior discreta com alternância de tema */}
      <div className="w-full max-w-md flex justify-end shrink-0">
        {theme && onToggleTheme ? <ThemeToggle theme={theme} onToggle={onToggleTheme} /> : null}
      </div>

      {/* Card principal centralizado vertical e horizontalmente */}
      <main className="w-full max-w-md my-auto flex flex-col justify-center items-center">
        {children}
      </main>

      {/* Rodapé discreto */}
      <footer className="w-full max-w-md text-center pt-6 pb-2 text-xs text-slate-400 shrink-0">
        <p>
          Sistema Corporativo de Autenticação • Softtek &amp; SAP Basis
        </p>
      </footer>
    </div>
  );
};

