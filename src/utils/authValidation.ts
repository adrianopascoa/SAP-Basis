import { PasswordRulesEvaluation, PasswordStrengthLevel } from '../types/auth';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function evaluatePasswordStrength(password: string): PasswordRulesEvaluation {
  if (!password) {
    return {
      hasMinLength: false,
      hasNumber: false,
      hasSpecialChar: false,
      hasUpperAndLower: false,
      strength: 'vazia',
      score: 0,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-=+[\]\\/`~]/.test(password);
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecialChar) score += 1;
  if (hasUpperAndLower && score > 0) score += 1;

  let strength: PasswordStrengthLevel = 'fraca';
  if (hasMinLength && hasNumber && hasSpecialChar) {
    strength = 'forte';
  } else if (hasMinLength && (hasNumber || hasSpecialChar)) {
    strength = 'media';
  } else {
    strength = 'fraca';
  }

  return {
    hasMinLength,
    hasNumber,
    hasSpecialChar,
    hasUpperAndLower,
    strength,
    score,
  };
}
