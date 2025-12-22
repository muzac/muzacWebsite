import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('home');

  const renderContent = () => {
    switch (activeMenu) {
      case 'aile-agaci':
        return (
          <div className="content">
            <h2>Aile Ağacı</h2>
            <p>Aile ağacı içeriği burada görüntülenecek.</p>
          </div>
        );
      case 'resimler':
        return (
          <div className="content">
            <h2>Resimler</h2>
            <p>Aile resimleri burada görüntülenecek.</p>
          </div>
        );
      default:
        return (
          <div className="content">
            <h2>Hoş Geldin =)</h2>
            <p>En süper Muzaç benim</p>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Muzaç Ailesi</h1>
        <nav className="nav">
          <button 
            className={activeMenu === 'home' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveMenu('home')}
          >
            Ana Sayfa
          </button>
          <button 
            className={activeMenu === 'aile-agaci' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveMenu('aile-agaci')}
          >
            Aile Ağacı
          </button>
          <button 
            className={activeMenu === 'resimler' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveMenu('resimler')}
          >
            Resimler
          </button>
        </nav>
      </header>
      
      <main className="main">
        {renderContent()}
      </main>
      
      <footer className="footer">
        <p>&copy; 2024 Muzaç Ailesi</p>
      </footer>
    </div>
  );
}

export default App;