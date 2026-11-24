import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthRoute, LoginFormData, LoginFormErrors } from '../../types/auth';
import { isValidEmail } from '../../utils/authValidation';
import { supabase } from '../../lib/supabase';

interface LoginViewProps {
  onNavigate: (route: AuthRoute) => void;
  onLoginSuccess: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: LoginFormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Digite um formato de e-mail corporativo válido.';
    }

    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve conter no mínimo 6 caracteres.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        let message = 'Falha na autenticação. Verifique suas credenciais.';
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          message = 'E-mail ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests') || error.status === 429) {
          message = 'Muitas tentativas consecutivas. Aguarde alguns instantes e tente novamente.';
        } else if (error.message) {
          message = error.message;
        }
        setErrors({ general: message });
        return;
      }

      if (data.user) {
        onLoginSuccess(data.user.email || formData.email.trim());
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Falha na autenticação. Tente novamente.';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Card Header Titles */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Acesse sua conta
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">
          Entre ou cadastre-se para gerenciar seu portfólio
        </p>
      </div>

      {/* Segmented Tab Switcher (Entrar / Cadastrar) */}
      <div
        className="bg-slate-100 p-1 rounded-xl flex items-center mb-6 select-none"
        role="tablist"
        aria-label="Opções de acesso"
      >
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="flex-1 py-2 text-center text-xs sm:text-sm font-semibold rounded-lg bg-white text-slate-800 shadow-sm transition duration-150"
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          onClick={() => onNavigate('cadastro')}
          className="flex-1 py-2 text-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 transition duration-150 cursor-pointer"
        >
          Cadastrar
        </button>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          {errors.general}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-700 mb-1.5 ml-0.5"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="login-email"
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
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5 ml-0.5"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
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
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </div>

        {/* Forgot Password Link */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => onNavigate('recuperar-senha')}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition cursor-pointer disabled:opacity-50"
          >
            Esqueceu sua senha?
          </button>
        </div>
      </form>
    </div>
  );
};
