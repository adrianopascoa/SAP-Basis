import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Info, Mail, AtSign, ExternalLink } from 'lucide-react';
import { AuthRoute } from '../../types/auth';
import { supabase } from '../../lib/supabase';

interface EmailSentViewProps {
  onNavigate: (route: AuthRoute) => void;
  recoveryEmail?: string;
  onResendLink?: (email: string) => void;
}

export const EmailSentView: React.FC<EmailSentViewProps> = ({
  onNavigate,
  recoveryEmail = 'francisco.bezerra@softtek.com',
  onResendLink,
}) => {
  const [countdown, setCountdown] = useState<number>(54);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendNotice(null);

    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo,
      });

      if (error) {
        setResendNotice(`Erro ao reenviar: ${error.message}`);
      } else {
        setCountdown(60);
        setResendNotice('Link de recuperação reenviado com sucesso! Verifique seu e-mail.');
        if (onResendLink) {
          onResendLink(recoveryEmail);
        }
      }
    } catch {
      setResendNotice('Falha ao reenviar o link. Tente novamente mais tarde.');
    } finally {
      setIsResending(false);
      setTimeout(() => {
        setResendNotice(null);
      }, 5000);
    }
  };

  const formattedCountdown = `(00:${String(countdown).padStart(2, '0')})`;

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 flex flex-col relative">
      {/* Sub-header: Back Arrow and Status Badge */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          type="button"
          aria-label="Voltar para tela de recuperação"
          onClick={() => onNavigate('recuperar-senha')}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] tracking-wide">
          E-mail enviado
        </span>
      </div>

      {/* Success Visual Graphic Container */}
      <div className="flex justify-center items-center my-3 relative">
        <div className="absolute w-20 h-20 rounded-full bg-blue-400 blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Mail className="w-9 h-9 text-white" strokeWidth={1.8} />
          {/* Small Success Check Dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Informational Text Section */}
      <div className="text-center mt-2 mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          E-mail enviado!
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-2.5">
          Enviamos as instruções e o link de acesso para redefinir sua senha para:
        </p>

        {/* Corporate Email Badge */}
        <div className="inline-flex items-center justify-center mt-3 px-3.5 py-1.5 rounded-lg bg-blue-50/90 border border-blue-100 text-blue-700 font-semibold text-xs break-all tracking-tight max-w-full">
          <AtSign className="w-3.5 h-3.5 mr-1.5 text-[#2563EB] shrink-0" />
          <span>{recoveryEmail}</span>
        </div>
      </div>

      {resendNotice && (
        <div className="mb-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs text-center font-medium">
          {resendNotice}
        </div>
      )}

      {/* Advisory Box */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-left mb-6">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-snug">
          Não recebeu o e-mail? Verifique sua pasta de spam ou lixo eletrônico. O link expira em{' '}
          <span className="font-semibold text-slate-700">30 minutos</span>.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Open Email Client Action */}
        <a
          href={`mailto:${recoveryEmail}`}
          className="w-full h-11 sm:h-12 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] transition-all rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer"
        >
          <span>Abrir aplicativo de e-mail</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        {/* Development Shortcut (only in DEV mode) */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => onNavigate('redefinir-senha')}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-dashed border-slate-300"
            title="Atalho visível apenas durante o desenvolvimento local"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Testar tela de redefinição (Ambiente Dev)</span>
          </button>
        )}

        {/* Resend Link Button */}
        <button
          type="button"
          disabled={countdown > 0 || isResending}
          onClick={handleResend}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {isResending ? (
            <span className="text-blue-600">Reenviando link...</span>
          ) : (
            <>
              <span>Não recebeu?</span>
              <span className={`text-[#2563EB] ${countdown === 0 ? 'hover:underline font-bold' : ''}`}>
                Reenviar link
              </span>
              {countdown > 0 && (
                <span className="text-slate-400 font-normal">{formattedCountdown}</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Card Footer Link */}
      <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
        Lembrou sua senha?
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline ml-1 cursor-pointer"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};
