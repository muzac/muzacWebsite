import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Verify from './Verify';

type AuthView = 'login' | 'register' | 'verify';

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleRegistrationSuccess = (email: string) => {
    setPendingEmail(email);
    setView('verify');
  };

  const handleVerificationSuccess = () => {
    setView('login');
  };

  return (
    <>
      {view === 'login' && (
        <Login onSwitchToRegister={() => setView('register')} />
      )}
      {view === 'register' && (
        <Register
          onSwitchToLogin={() => setView('login')}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}
      {view === 'verify' && (
        <Verify
          email={pendingEmail}
          onVerified={handleVerificationSuccess}
          onBack={() => setView('register')}
        />
      )}
    </>
  );
};

export default Auth;
