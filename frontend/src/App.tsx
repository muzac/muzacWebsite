import React, { useState } from 'react';
import './App.css';
import FamilyTree from './FamilyTree';

interface FamilyMember {
  id: string;
  name: string;
  surname: string;
  nickname?: string;
  birthday: string;
  marriedTo?: string;
  mom: string;
  dad: string;
  gender: 'Male' | 'Female';
  photo: string[];
}

function App() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null
  );
  const [apiUrl] = useState(
    process.env.REACT_APP_API_URL || 'https://api.muzac.com.tr'
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'aile-agaci':
        return (
          <div className="content">
            <h2>Aile Ağacı</h2>
            <FamilyTree apiUrl={apiUrl} onMemberClick={setSelectedMember} />

            {selectedMember && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#e8f4f8',
                  borderRadius: '8px',
                }}
              >
                <h4>Seçili Üye:</h4>
                <p>
                  <strong>Ad Soyad:</strong> {selectedMember.name}{' '}
                  {selectedMember.surname?.charAt(0) || ''}.
                </p>
                {selectedMember.nickname && (
                  <p>
                    <strong>Lakap:</strong> {selectedMember.nickname}
                  </p>
                )}
                <p>
                  <strong>Cinsiyet:</strong> {selectedMember.gender}
                </p>
                <p>
                  <strong>Doğum Tarihi:</strong>{' '}
                  {new Date(selectedMember.birthday).toLocaleDateString(
                    'tr-TR'
                  )}
                </p>
              </div>
            )}
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
              activeMenu === 'aile-agaci' ? 'nav-button active' : 'nav-button'
            }
            onClick={() => setActiveMenu('aile-agaci')}
          >
            Aile Ağacı
          </button>
          <button
            className={
              activeMenu === 'resimler' ? 'nav-button active' : 'nav-button'
            }
            onClick={() => setActiveMenu('resimler')}
          >
            Resimler
          </button>
        </nav>
      </header>

      <main className="main">{renderContent()}</main>

      <footer className="footer">
        <p>&copy; 2025 - Emel</p>
      </footer>
    </div>
  );
}

export default App;
