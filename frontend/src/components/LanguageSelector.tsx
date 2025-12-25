import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, saveUserPreferences } = useLanguage();
  const { user } = useAuth();

  const handleLanguageChange = async (newLanguage: 'tr' | 'en') => {
    setLanguage(newLanguage);

    if (user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        await saveUserPreferences(token, newLanguage);
      }
    }
  };

  return (
    <div className="language-selector">
      <button
        className={`lang-btn ${language === 'tr' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('tr')}
      >
        TR
      </button>
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
