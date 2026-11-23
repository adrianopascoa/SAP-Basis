import { AppRoute } from './sapLogs';

export type AuthRoute =
  | 'login'
  | 'cadastro'
  | 'recuperar-senha'
  | 'email-enviado'
  | 'redefinir-senha';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface RegisterFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export type PasswordStrengthLevel = 'vazia' | 'fraca' | 'media' | 'forte';

export interface PasswordRulesEvaluation {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasUpperAndLower: boolean;
  strength: PasswordStrengthLevel;
  score: number; // 0 to 4
}
