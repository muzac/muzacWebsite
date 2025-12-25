import React, { useState } from 'react';
import './styles/App.css';
import Images from './pages/images/Images';
import Upload from './pages/upload/Upload';
import Auth from './pages/auth/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('pics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  // Redirect to images tab when user logs in
  React.useEffect(() => {
    if (user && activeMenu === 'auth') {
      setActiveMenu('pics');
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
      case 'pics':
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
        {/* Mobile Header */}
        <div className="mobile-header">
          <div className="mobile-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          </div>
          <h1 className="mobile-title">
            <strong>Mu</strong>htelif <strong>Za</strong>manlar{' '}
            <strong>C</strong>etveli
          </h1>
          <div className="mobile-right">
            {user ? (
              <button className="mobile-user-btn" onClick={logout}>
                Çıkış
              </button>
            ) : (
              <button
                className="mobile-user-btn"
                onClick={() => setActiveMenu('auth')}
              >
                Giriş
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <button
              className={
                activeMenu === 'home'
                  ? 'mobile-nav-button active'
                  : 'mobile-nav-button'
              }
              onClick={() => {
                setActiveMenu('home');
                setMobileMenuOpen(false);
              }}
            >
              Ana Sayfa
            </button>
            <button
              className={
                activeMenu === 'pics'
                  ? 'mobile-nav-button active'
                  : 'mobile-nav-button'
              }
              onClick={() => {
                setActiveMenu('pics');
                setMobileMenuOpen(false);
              }}
            >
              Resimler
            </button>
          </div>
        )}

        {/* Desktop Header */}
        <div className="desktop-header">
          <div className="desktop-top-nav">
            <div className="desktop-nav-left">
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
                  activeMenu === 'pics' ? 'nav-button active' : 'nav-button'
                }
                onClick={() => setActiveMenu('pics')}
              >
                Resimler
              </button>
            </div>
            <div className="desktop-nav-right">
              {user ? (
                <button className="nav-button" onClick={logout}>
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
            </div>
          </div>
          <h1>
            <strong>Mu</strong>htelif <strong>Za</strong>manlar{' '}
            <strong>C</strong>etveli
          </h1>
        </div>
      </header>

      <main className="main">{renderContent()}</main>

      <footer className="footer">
        <p>&copy; 2025 - Emel Muzaç</p>
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
