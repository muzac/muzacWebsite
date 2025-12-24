import React, { useState } from 'react';
import './Auth.css';

interface VerifyProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const Verify: React.FC<VerifyProps> = ({ email, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.muzac.com.tr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Verification failed');
      }

      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resend code');
      }

      setResendMessage('Kod yeniden gönderildi!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>E-posta Doğrulama</h2>
        <p>E-posta adresinize gönderilen doğrulama kodunu girin:</p>
        <p>
          <strong>{email}</strong>
        </p>
        {error && <div className="error">{error}</div>}
        {resendMessage && <div className="success">{resendMessage}</div>}
        <input
          type="text"
          placeholder="Doğrulama Kodu"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Doğrulanıyor...' : 'Doğrula'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? 'Gönderiliyor...' : 'Kodu Yeniden Gönder'}
        </button>
        <button type="button" className="link-button" onClick={onBack}>
          Geri Dön
        </button>
      </form>
    </div>
  );
};

export default Verify;
