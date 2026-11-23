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

  const handleRegisterSuccess = (email: string, hasSession: boolean) => {
    if (hasSession) {
      if (onNotify) {
        onNotify('success', 'Cadastro realizado!', `Bem-vindo ao SAP Basis, ${email}`);
      }
      if (onLoginSuccess) {
        onLoginSuccess(email);
      }
    } else {
      if (onNotify) {
        onNotify(
          'info',
          'Conta criada com sucesso!',
          `Enviamos um e-mail de confirmação para ${email}. Verifique sua caixa de entrada para ativar o acesso.`
        );
      }
      onNavigate('login');
    }
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
      onNotify(
        'success',
        'Senha redefinida com sucesso!',
        'Sua nova senha foi salva. Entre na sua conta para continuar.'
      );
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
