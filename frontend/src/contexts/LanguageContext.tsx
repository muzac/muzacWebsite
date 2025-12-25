import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  loadUserPreferences: (token: string) => Promise<void>;
  saveUserPreferences: (token: string, language: Language) => Promise<void>;
}

const translations = {
  tr: {
    'site.title': 'Muhtelif Zamanlar Cetveli',
    'nav.home': 'Ana Sayfa',
    'nav.images': 'Resimler',
    'nav.video': 'Video',
    'nav.login': 'Giriş',
    'nav.logout': 'Çıkış',
    'nav.register': 'Kayıt',
    'calendar.loadMore': 'Daha fazla yükle',
    'auth.login': 'Giriş Yap',
    'auth.register': 'Kayıt Ol',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.confirmPassword': 'Şifreyi Onayla',
    'auth.verificationCode': 'Doğrulama Kodu',
    'auth.verify': 'Doğrula',
    'auth.resendCode': 'Kodu Tekrar Gönder',
    'auth.noAccount': 'Hesabınız yok mu?',
    'auth.hasAccount': 'Zaten hesabınız var mı?',
    'auth.passwordMismatch': 'Şifreler eşleşmiyor',
    'auth.passwordTooShort': 'Şifre en az 8 karakter olmalıdır',
    'video.title': 'Video Oluştur',
    'video.startDate': 'Başlangıç Tarihi',
    'video.endDate': 'Bitiş Tarihi',
    'video.generate': 'Video Oluştur',
    'video.generating': 'Video Oluşturuluyor...',
    'video.preview': 'Önizleme',
    'video.images': 'resim',
    'video.noImages': 'Videoyu görüntülemek için bir resim seçin',
    'video.backgroundColor': 'Arkaplan Rengi',
    'video.transition': 'Geçiş Efekti',
    'video.duration': 'Resim Süresi',
    'video.fade': 'Solma',
    'video.slide': 'Kayma',
    'video.none': 'Yok',
    'home.welcome': 'Hoş Geldiniz',
    'home.subtitle': 'Günlük Anılarınızı Kaydedin ve Paylaşın',
    'home.description':
      'MUZAC, günlük yaşamınızın özel anlarını fotoğraflarla kaydetmenizi sağlayan kişisel bir takvim uygulamasıdır. Her gün için bir fotoğraf yükleyerek, zamanla kendi görsel hikayenizi oluşturun.',
    'home.features.title': 'Özellikler',
    'home.features.calendar':
      'Günlük fotoğraf takvimi ile anılarınızı düzenleyin',
    'home.features.video':
      'Seçtiğiniz fotoğraflardan özelleştirilebilir videolar oluşturun',
    'home.features.secure':
      'Güvenli bulut depolama ile fotoğraflarınız her zaman korunur',
    'home.getStarted':
      'Resimler ve Video sekmelerini ziyaret ederek siteyi deneyimleyebilirsiniz. Fotoğraf yüklemek için giriş yapın.',
    'months.0': 'Ocak',
    'months.1': 'Şubat',
    'months.2': 'Mart',
    'months.3': 'Nisan',
    'months.4': 'Mayıs',
    'months.5': 'Haziran',
    'months.6': 'Temmuz',
    'months.7': 'Ağustos',
    'months.8': 'Eylül',
    'months.9': 'Ekim',
    'months.10': 'Kasım',
    'months.11': 'Aralık',
    'days.0': 'Pzt',
    'days.1': 'Sal',
    'days.2': 'Çar',
    'days.3': 'Per',
    'days.4': 'Cum',
    'days.5': 'Cmt',
    'days.6': 'Paz',
  },
  en: {
    'site.title': 'MUZAC',
    'nav.home': 'Home',
    'nav.images': 'Images',
    'nav.video': 'Video',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.register': 'Register',
    'calendar.loadMore': 'Load More',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.verificationCode': 'Verification Code',
    'auth.verify': 'Verify',
    'auth.resendCode': 'Resend Code',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.passwordTooShort': 'Password must be at least 8 characters',
    'video.title': 'Create Video',
    'video.startDate': 'Start Date',
    'video.endDate': 'End Date',
    'video.generate': 'Generate Video',
    'video.generating': 'Generating Video...',
    'video.preview': 'Preview',
    'video.images': 'images',
    'video.noImages': 'Select an image to view the video',
    'video.backgroundColor': 'Background Color',
    'video.transition': 'Transition Effect',
    'video.duration': 'Image Duration',
    'video.fade': 'Fade',
    'video.slide': 'Slide',
    'video.none': 'None',
    'home.welcome': 'Welcome',
    'home.subtitle': 'Capture and Share Your Daily Moments',
    'home.description':
      'MUZAC is a personal calendar application that allows you to document special moments of your daily life through photographs. Upload one photo each day to create your own visual story over time.',
    'home.features.title': 'Features',
    'home.features.calendar':
      'Organize your memories with a daily photo calendar',
    'home.features.video':
      'Create customizable videos from your selected photos',
    'home.features.secure':
      'Secure cloud storage keeps your photos safe at all times',
    'home.getStarted':
      'Explore the Images and Video tabs to experience the website. Login to upload your own photos.',
    'months.0': 'January',
    'months.1': 'February',
    'months.2': 'March',
    'months.3': 'April',
    'months.4': 'May',
    'months.5': 'June',
    'months.6': 'July',
    'months.7': 'August',
    'months.8': 'September',
    'months.9': 'October',
    'months.10': 'November',
    'months.11': 'December',
    'days.0': 'Mon',
    'days.1': 'Tue',
    'days.2': 'Wed',
    'days.3': 'Thu',
    'days.4': 'Fri',
    'days.5': 'Sat',
    'days.6': 'Sun',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>('tr');
  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.muzac.com.tr';

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'tr' || saved === 'en')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const loadUserPreferences = async (token: string) => {
    try {
      const response = await fetch(`${apiUrl}/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.language) {
          setLanguage(data.language);
          localStorage.setItem('language', data.language);
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const saveUserPreferences = async (token: string, language: Language) => {
    try {
      await fetch(`${apiUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language }),
      });
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        loadUserPreferences,
        saveUserPreferences,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
