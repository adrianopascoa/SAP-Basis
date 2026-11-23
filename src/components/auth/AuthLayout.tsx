import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-50 text-slate-800 antialiased p-4 sm:p-6 lg:p-8 selection:bg-blue-100 selection:text-blue-900">
      {/* Espaçador superior invisível para balancear o alinhamento com o rodapé */}
      <div className="hidden sm:block h-4 shrink-0" aria-hidden="true" />

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

