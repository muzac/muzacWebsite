import React, { useState, useEffect } from 'react';
import './App.css';

interface FamilyMember {
  id: string;
  name: string;
  relation?: string;
}

function App() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl] = useState(
    process.env.REACT_APP_API_URL || 'https://api.muzac.com.tr'
  );

  const fetchFamilyTree = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/familyTree`);
      const data = await response.json();
      console.log('Family Tree API Response:', data);
    } catch (error) {
      console.error('Error fetching family tree:', error);
    }
    setLoading(false);
  };

  const addFamilyMember = async (name: string, relation: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/familyTree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, relation }),
      });

      if (response.ok) {
        const member = await response.json();
        setFamilyMembers([...familyMembers, member]);
        console.log('Added family member:', member);
      }
    } catch (error) {
      console.error('Error adding family member:', error);
    }
    setLoading(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'aile-agaci':
        return (
          <div className="content">
            <h2>Aile Ağacı</h2>
            <button
              onClick={fetchFamilyTree}
              disabled={loading}
              style={{
                padding: '10px 20px',
                margin: '10px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Yükleniyor...' : 'Aile Ağacını Getir'}
            </button>
            <button
              onClick={() => addFamilyMember('Örnek İsim', 'Kardeş')}
              disabled={loading}
              style={{
                padding: '10px 20px',
                margin: '10px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Aile Üyesi Ekle
            </button>
            <p>API URL: {apiUrl}/familyTree</p>
            {familyMembers.length > 0 && (
              <div>
                <h3>Aile Üyeleri:</h3>
                {familyMembers.map((member) => (
                  <div key={member.id} style={{ margin: '10px 0' }}>
                    <strong>{member.name}</strong> - {member.relation}
                  </div>
                ))}
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
        <p>&copy; 2024 Muzaç Ailesi</p>
      </footer>
    </div>
  );
}

export default App;
