import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthRoute, RegisterFormData, RegisterFormErrors } from '../../types/auth';
import { isValidEmail } from '../../utils/authValidation';
import { supabase } from '../../lib/supabase';

interface RegisterViewProps {
  onNavigate: (route: AuthRoute) => void;
  onRegisterSuccess: (email: string, hasSession: boolean) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onNavigate,
  onRegisterSuccess,
}) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'acceptTerms' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: RegisterFormErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Informe seu nome completo.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail corporativo é obrigatório.';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Digite um formato de e-mail corporativo válido.';
    }

    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'A senha deve conter no mínimo 8 caracteres.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os Termos de Uso e Política de Privacidade.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      });

      if (error) {
        let message = 'Não foi possível concluir o cadastro.';
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already exists')
        ) {
          message = 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.';
        } else if (error.message.includes('Password should be at least')) {
          message = 'A senha deve conter no mínimo 8 caracteres.';
        } else if (error.message.includes('Too many requests') || error.status === 429) {
          message = 'Muitas tentativas consecutivas. Aguarde alguns instantes.';
        } else if (error.message) {
          message = error.message;
        }
        setErrors({ general: message });
        return;
      }

      // Se retornou sessão ativa imediata, entra direto; se não, requer confirmação de e-mail
      const hasSession = !!data.session;
      onRegisterSuccess(formData.email.trim(), hasSession);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao realizar cadastro. Tente novamente.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Header Titles */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Crie sua conta
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">
          Preencha seus dados para começar a gerenciar seu portfólio
        </p>
      </div>

      {/* Segmented Tab Switcher */}
      <div
        className="bg-slate-100 p-1 rounded-xl flex items-center mb-6 select-none"
        role="tablist"
        aria-label="Opções de acesso"
      >
        <button
          type="button"
          role="tab"
          aria-selected="false"
          onClick={() => onNavigate('login')}
          disabled={isSubmitting}
          className="flex-1 py-2 text-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 transition duration-150 cursor-pointer disabled:opacity-50"
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="flex-1 py-2 text-center text-xs sm:text-sm font-semibold rounded-lg bg-white text-slate-800 shadow-sm border border-black/5 transition duration-150"
        >
          Cadastrar
        </button>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          {errors.general}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="reg-fullname"
            className="block text-xs font-semibold text-slate-700 mb-1.5 ml-0.5"
          >
            Nome completo
          </label>
          <input
            id="reg-fullname"
            type="text"
            autoComplete="name"
            placeholder="Seu nome completo"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            disabled={isSubmitting}
            className={`w-full px-3.5 py-2.5 sm:py-3 bg-[#EBF3FF] dark:bg-[#17263E] border rounded-xl text-slate-800 dark:text-slate-100 text-sm font-normal focus:bg-white dark:focus:bg-[#162133] focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
              errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-transparent'
            }`}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.fullName}</p>
          )}
        </div>

        {/* Corporate Email */}
        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-semibold text-slate-700 mb-1.5 ml-0.5"
          >
            Email corporativo
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="seu.email@empresa.com"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={isSubmitting}
            className={`w-full px-3.5 py-2.5 sm:py-3 bg-[#EBF3FF] dark:bg-[#17263E] border rounded-xl text-slate-800 dark:text-slate-100 text-sm font-normal focus:bg-white dark:focus:bg-[#162133] focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
              errors.email ? 'border-red-400 focus:ring-red-400' : 'border-transparent'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5 ml-0.5"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={handleChange('password')}
            disabled={isSubmitting}
            className={`w-full px-3.5 py-2.5 sm:py-3 pr-10 bg-[#EBF3FF] dark:bg-[#17263E] border rounded-xl text-slate-800 dark:text-slate-100 text-sm font-normal focus:bg-white dark:focus:bg-[#162133] focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
                errors.password ? 'border-red-400 focus:ring-red-400' : 'border-transparent'
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reg-confirm-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5 ml-0.5"
          >
            Confirmar senha
          </label>
          <div className="relative">
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
            disabled={isSubmitting}
            className={`w-full px-3.5 py-2.5 sm:py-3 pr-10 bg-[#EBF3FF] dark:bg-[#17263E] border rounded-xl text-slate-800 dark:text-slate-100 text-sm font-normal focus:bg-white dark:focus:bg-[#162133] focus:ring-2 focus:ring-[#2563EB] transition-all outline-none placeholder:text-slate-400 disabled:opacity-60 ${
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
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="pt-1">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange('acceptTerms')}
                disabled={isSubmitting}
                className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-slate-300 rounded cursor-pointer transition-colors disabled:opacity-60"
              />
            </div>
            <div className="ml-2.5 text-xs">
              <label htmlFor="terms-checkbox" className="text-slate-500 cursor-pointer leading-tight">
                Concordo com os{' '}
                <span className="text-[#2563EB] hover:underline font-medium">Termos de Uso</span>{' '}
                e{' '}
                <span className="text-[#2563EB] hover:underline font-medium">
                  Política de Privacidade
                </span>
                .
              </label>
            </div>
          </div>
          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition duration-150 ease-in-out cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Cadastrando...</span>
              </>
            ) : (
              <span>Cadastrar</span>
            )}
          </button>
        </div>
      </form>

      {/* Footer Link */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            disabled={isSubmitting}
            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline ml-1 cursor-pointer disabled:opacity-50"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};
