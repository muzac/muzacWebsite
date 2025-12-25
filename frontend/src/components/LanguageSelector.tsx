import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-selector">
      <button
        className={`lang-btn ${language === 'tr' ? 'active' : ''}`}
        onClick={() => setLanguage('tr')}
      >
        TR
      </button>
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
