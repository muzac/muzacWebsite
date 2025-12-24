import React, { useState } from 'react';
import './App.css';
import Images from './Images';
import Upload from './Upload';
import Auth from './Auth';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('home');
  const { user, logout, loading } = useAuth();

  // Redirect to images tab when user logs in
  React.useEffect(() => {
    if (user && activeMenu === 'auth') {
      setActiveMenu('resimler');
    }
  }, [user, activeMenu]);

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  // Check if current path is /upload
  const isUploadPage = window.location.pathname === '/upload';

  if (isUploadPage) {
    return <Upload />;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'resimler':
        return (
          <div className="content">
            <Images />
          </div>
        );
      case 'auth':
        return (
          <div className="content">
            <Auth />
          </div>
        );
      default:
        return (
          <div className="content">
            <p>
              {' '}
              Merhaba, ben Emel. Biraz sabır... Şimdilik site yapım
              aşamasında{' '}
            </p>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <img
                src="/underConstruction.jpg"
                alt="Under Construction"
                style={{
                  maxWidth: '50%',
                  height: 'auto',
                  borderRadius: '8px',
                }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Emel Muzaç</h1>
        <nav className="nav">
          <button
            className={
              activeMenu === 'home' ? 'nav-button active' : 'nav-button'
            }
            onClick={() => setActiveMenu('home')}
          >
            Ana Sayfa
          </button>
          <button
            className={
              activeMenu === 'resimler' ? 'nav-button active' : 'nav-button'
            }
            onClick={() => setActiveMenu('resimler')}
          >
            Resimler
          </button>
          {user ? (
            <button className="nav-button logout" onClick={logout}>
              Çıkış ({user.email})
            </button>
          ) : (
            <button
              className={
                activeMenu === 'auth' ? 'nav-button active' : 'nav-button'
              }
              onClick={() => setActiveMenu('auth')}
            >
              Giriş / Kayıt
            </button>
          )}
        </nav>
      </header>

      <main className="main">{renderContent()}</main>

      <footer className="footer">
        <p>&copy; 2025 - Emel</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
