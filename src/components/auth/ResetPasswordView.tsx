import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AuthRoute, ResetPasswordFormData, ResetPasswordFormErrors } from '../../types/auth';
import { evaluatePasswordStrength } from '../../utils/authValidation';
import { supabase } from '../../lib/supabase';

interface ResetPasswordViewProps {
  onNavigate: (route: AuthRoute) => void;
  onResetSuccess: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onNavigate,
  onResetSuccess,
}) => {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const evaluation = useMemo(
    () => evaluatePasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (field: keyof ResetPasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: ResetPasswordFormErrors = {};
    if (!formData.password) {
      newErrors.password = 'Digite sua nova senha.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'A senha deve conter no mínimo 8 caracteres.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua nova senha.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        let message = 'Não foi possível redefinir sua senha.';
        if (
          error.message.includes('different from the old password') ||
          error.message.includes('same_password')
        ) {
          message = 'A nova senha deve ser diferente da senha anterior.';
        } else if (
          error.message.includes('Auth session missing') ||
          error.message.includes('not authenticated')
        ) {
          message = 'Sessão de recuperação expirada ou inválida. Solicite um novo link por e-mail.';
        } else if (error.message) {
          message = error.message;
        }
        setErrors({ general: message });
        return;
      }

      if (data.user) {
        onResetSuccess();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao redefinir sua senha. Tente novamente.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthLabel = () => {
    switch (evaluation.strength) {
      case 'forte':
        return { label: 'Forte', color: 'text-emerald-600' };
      case 'media':
        return { label: 'Média', color: 'text-amber-600' };
      case 'fraca':
        return { label: 'Fraca', color: 'text-rose-600' };
      default:
        return { label: '—', color: 'text-slate-400' };
    }
  };

  const strengthInfo = getStrengthLabel();

  const barColors = useMemo(() => {
    if (evaluation.strength === 'forte') {
      return ['bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500'];
    }
    if (evaluation.strength === 'media') {
      return ['bg-emerald-500', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-200'];
    }
    if (evaluation.strength === 'fraca') {
      return ['bg-rose-500', 'bg-slate-200', 'bg-slate-200', 'bg-slate-200'];
    }
    return ['bg-slate-200', 'bg-slate-200', 'bg-slate-200', 'bg-slate-200'];
  }, [evaluation.strength]);

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 flex flex-col relative">
      {/* Navigation & Security Badge Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          aria-label="Voltar para login"
          onClick={() => onNavigate('login')}
          disabled={isSubmitting}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#2563EB] bg-blue-50">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
          Segurança
        </span>
      </div>

      {/* Title & Instructional Text */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
          Criar nova senha
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto font-normal">
          Crie uma senha forte e segura com no mínimo 8 caracteres para acessar sua conta.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          {errors.general}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Field 1: New Password */}
        <div>
          <label
            htmlFor="reset-new-password"
            className="block text-xs font-semibold text-slate-800 mb-1.5 ml-0.5"
          >
            Nova senha
          </label>
          <div className="relative">
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={handleChange('password')}
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 sm:py-3 pr-10 bg-[#EFF5FE] dark:bg-[#17263E] border rounded-xl text-slate-800 dark:text-slate-100 text-sm font-normal focus:bg-white dark:focus:bg-[#162133] focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
                errors.password ? 'border-red-400 focus:ring-red-400' : 'border-transparent'
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.password}</p>
          )}
        </div>

        {/* Password Strength & Rules Assessment Widget */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Força da senha:</span>
            <span className={`text-[11px] font-bold ${strengthInfo.color}`}>
              {strengthInfo.label}
            </span>
          </div>

          {/* Multi-step Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            <div className={`h-full rounded-full transition-colors ${barColors[0]}`} />
            <div className={`h-full rounded-full transition-colors ${barColors[1]}`} />
            <div className={`h-full rounded-full transition-colors ${barColors[2]}`} />
            <div className={`h-full rounded-full transition-colors ${barColors[3]}`} />
          </div>

          {/* Criteria Checklist */}
          <ul className="text-[11.5px] text-slate-500 space-y-1.5 pt-1">
            <li
              className={`flex items-center gap-2 font-medium ${
                evaluation.hasMinLength ? 'text-emerald-600' : 'text-slate-400 font-normal'
              }`}
            >
              {evaluation.hasMinLength ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={3} />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] leading-none">
                  •
                </span>
              )}
              <span>Mínimo 8 caracteres</span>
            </li>

            <li
              className={`flex items-center gap-2 font-medium ${
                evaluation.hasNumber ? 'text-emerald-600' : 'text-slate-400 font-normal'
              }`}
            >
              {evaluation.hasNumber ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={3} />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] leading-none">
                  •
                </span>
              )}
              <span>Pelo menos 1 número</span>
            </li>

            <li
              className={`flex items-center gap-2 font-medium ${
                evaluation.hasSpecialChar ? 'text-emerald-600' : 'text-slate-400 font-normal'
              }`}
            >
              {evaluation.hasSpecialChar ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={3} />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] leading-none">
                  •
                </span>
              )}
              <span>Pelo menos 1 caractere especial (!@#$)</span>
            </li>
          </ul>
        </div>

        {/* Field 2: Confirm Password */}
        <div>
          <label
            htmlFor="reset-confirm-password"
            className="block text-xs font-semibold text-slate-800 mb-1.5 ml-0.5"
          >
            Confirmar nova senha
          </label>
          <div className="relative">
            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita sua nova senha"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 sm:py-3 pr-10 bg-[#EFF5FE] dark:bg-[#17263E] border rounded-xl text-slate-800 dark:text-slate-100 text-sm font-normal focus:bg-white dark:focus:bg-[#162133] focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
                errors.confirmPassword
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-transparent'
              }`}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-[#2263F0] hover:bg-[#1C54D4] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-[15px] rounded-2xl shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando nova senha...</span>
              </>
            ) : (
              <>
                <span>Salvar nova senha</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Bottom Card Navigation Link */}
      <div className="mt-6 text-center text-xs text-slate-600 font-medium">
        Lembrou sua senha?{' '}
        <button
          type="button"
          onClick={() => onNavigate('login')}
          disabled={isSubmitting}
          className="text-[#2563EB] hover:underline font-bold transition-colors ml-1 cursor-pointer disabled:opacity-50"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};
