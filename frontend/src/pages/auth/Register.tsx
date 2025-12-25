import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Auth.css';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess: (email: string) => void;
}

const Register: React.FC<RegisterProps> = ({
  onSwitchToLogin,
  onRegistrationSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.REACT_APP_API_URL || 'https://api.muzac.com.tr';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      onRegistrationSuccess(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{t('auth.register')}</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.confirmPassword')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? `${t('auth.register')}...` : t('auth.register')}
        </button>
        <p>
          {t('auth.hasAccount')}{' '}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToLogin}
          >
            {t('auth.login')}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Register;
