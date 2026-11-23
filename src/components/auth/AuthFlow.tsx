import React, { useState } from 'react';
import { AuthRoute } from '../../types/auth';
import { AuthLayout } from './AuthLayout';
import { LoginView } from './LoginView';
import { RegisterView } from './RegisterView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { EmailSentView } from './EmailSentView';
import { ResetPasswordView } from './ResetPasswordView';

interface AuthFlowProps {
  currentRoute: AuthRoute;
  onNavigate: (route: AuthRoute) => void;
  onLoginSuccess?: (email: string) => void;
  onNotify?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
  currentRoute,
  onNavigate,
  onLoginSuccess,
  onNotify,
}) => {
  const [recoveryEmail, setRecoveryEmail] = useState<string>('francisco.bezerra@softtek.com');

  const handleLoginSuccess = (email: string) => {
    if (onLoginSuccess) {
      onLoginSuccess(email);
    } else if (onNotify) {
      onNotify('success', 'Login realizado!', `Bem-vindo de volta, ${email}`);
    }
  };

  const handleRegisterSuccess = (email: string) => {
    if (onNotify) {
      onNotify(
        'success',
        'Conta criada com sucesso!',
        `Seu cadastro com o e-mail ${email} foi concluído. Acesse sua conta.`
      );
    }
    onNavigate('login');
  };

  const handleRequestResetSuccess = (email: string) => {
    setRecoveryEmail(email);
    if (onNotify) {
      onNotify('info', 'E-mail enviado', `Instruções enviadas para ${email}`);
    }
    onNavigate('email-enviado');
  };

  const handleResetSuccess = () => {
    if (onNotify) {
      onNotify('success', 'Senha redefinida!', 'Sua nova senha foi salva. Faça login.');
    }
    onNavigate('login');
  };

  const handleResendLink = (email: string) => {
    if (onNotify) {
      onNotify('info', 'Link reenviado', `Novo link enviado para ${email}`);
    }
  };

  return (
    <AuthLayout>
      {currentRoute === 'login' && (
        <LoginView onNavigate={onNavigate} onLoginSuccess={handleLoginSuccess} />
      )}

      {currentRoute === 'cadastro' && (
        <RegisterView onNavigate={onNavigate} onRegisterSuccess={handleRegisterSuccess} />
      )}

      {currentRoute === 'recuperar-senha' && (
        <ForgotPasswordView
          initialEmail={recoveryEmail}
          onNavigate={onNavigate}
          onRequestResetSuccess={handleRequestResetSuccess}
        />
      )}

      {currentRoute === 'email-enviado' && (
        <EmailSentView
          recoveryEmail={recoveryEmail}
          onNavigate={onNavigate}
          onResendLink={handleResendLink}
        />
      )}

      {currentRoute === 'redefinir-senha' && (
        <ResetPasswordView onNavigate={onNavigate} onResetSuccess={handleResetSuccess} />
      )}
    </AuthLayout>
  );
};
