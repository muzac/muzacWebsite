import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const SiteTitle: React.FC = () => {
  const { language } = useLanguage();

  if (language === 'tr') {
    return (
      <>
        <strong>Mu</strong>htelif <strong>Za</strong>manlar <strong>C</strong>
        etveli
      </>
    );
  }

  return <>MUZAC</>;
};

export default SiteTitle;
