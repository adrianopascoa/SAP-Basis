import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Info, Shield } from 'lucide-react';
import { AuthRoute, ForgotPasswordFormData, ForgotPasswordFormErrors } from '../../types/auth';
import { isValidEmail } from '../../utils/authValidation';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordViewProps {
  onNavigate: (route: AuthRoute) => void;
  onRequestResetSuccess: (email: string) => void;
  initialEmail?: string;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigate,
  onRequestResetSuccess,
  initialEmail = '',
}) => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: initialEmail,
  });
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: ForgotPasswordFormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail corporativo é obrigatório.';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Digite um e-mail válido para envio do link.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
        redirectTo,
      });

      if (error) {
        let message = 'Falha ao solicitar recuperação de senha.';
        if (error.message.includes('rate limit') || error.status === 429) {
          message = 'Muitas solicitações em sequência. Aguarde 60 segundos para tentar novamente.';
        } else if (error.message) {
          message = error.message;
        }
        setErrors({ general: message });
        return;
      }

      onRequestResetSuccess(formData.email.trim());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao solicitar recuperação. Tente novamente.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 flex flex-col relative">
      {/* Top Navigation within Card */}
      <div className="flex items-center justify-between mb-4">
        {/* Back Button */}
        <button
          type="button"
          aria-label="Voltar para a página anterior"
          onClick={() => onNavigate('login')}
          disabled={isSubmitting}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Security Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB]">
          <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
          Segurança
        </span>
      </div>

      {/* Heading & Instructions */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Recuperar senha
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed px-1">
          Digite seu e-mail corporativo cadastrado e enviaremos um link com instruções para
          redefinir seu acesso.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          {errors.general}
        </div>
      )}

      {/* Recovery Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="recovery-email"
            className="block text-xs font-semibold text-slate-700 tracking-tight mb-1.5 ml-0.5"
          >
            Email corporativo
          </label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            placeholder="seu.email@empresa.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full px-3.5 py-2.5 sm:py-3 bg-[#EEF4FE] border rounded-xl text-slate-800 text-sm font-normal focus:bg-white focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
              errors.email ? 'border-red-400 focus:ring-red-400' : 'border-transparent'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.email}</p>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm sm:text-base font-semibold rounded-2xl shadow-md shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando link...</span>
              </>
            ) : (
              <>
                <span>Enviar link de recuperação</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security / Spam Advice Box */}
      <div className="mt-6 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-snug">
          Não se esqueça de verificar a caixa de spam ou lixo eletrônico caso o e-mail não
          apareça em alguns minutos.
        </p>
      </div>

      {/* Card Footer Link */}
      <div className="mt-6 text-center pt-2">
        <p className="text-xs text-slate-500 font-medium">
          Lembrou sua senha?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            disabled={isSubmitting}
            className="text-[#2563EB] font-bold hover:underline ml-1 cursor-pointer disabled:opacity-50"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};
