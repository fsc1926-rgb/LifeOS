import { useState, useEffect } from 'react';
import './App.css';
import LockScreen from './components/LockScreen';
import Header from './components/Header';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Wallet from './components/Wallet';
import Garage from './components/Garage';
import Maintenance from './components/Maintenance';
import Inventory from './components/Inventory';
import Gallery from './components/Gallery';
import Vault from './components/Vault'; // <-- Nuovo import del Vault
import Hub from './components/Hub';

import { DataService } from './dataService'; 

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [appData, setAppData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateData = async (newData) => {
    setAppData(newData);
    await DataService.saveData(newData);
  };

  const handleUnlock = async () => {
    console.log("Inizio sincronizzazione col Cloud...");
    const data = await DataService.loadData();
    setAppData(data);
    
    if (data?.settings?.theme) {
      setTheme(data.settings.theme);
    }
    
    setIsLocked(false);
  };

  const handleTestSave = async () => {
    setIsSyncing(true);
    const newData = { ...appData };
    
    if (newData.accounts && newData.accounts.length > 0) {
      newData.accounts[0].balance += 10;
    }
    newData.settings.theme = theme;
    
    setAppData(newData);
    await DataService.saveData(newData);
    
    setIsSyncing(false);
    setIsFabOpen(false);
    alert("Dati salvati! Il saldo del conto principale è aumentato.");
  };

  return (
    <>
      {isLocked ? (
        <LockScreen onUnlock={handleUnlock} />
      ) : (
        <>
          <Header />
          
          <div className="main-container">
            {/* Moduli Principali (Tab in basso) */}
            {activeTab === 'dashboard' && <Dashboard data={appData} updateData={updateData} />}
            {activeTab === 'calendar' && <Calendar data={appData} updateData={updateData} />}
            {activeTab === 'wallet' && <Wallet data={appData} updateData={updateData} />}
            
            {/* Sottomoduli dell'Hub */}
            {activeTab === 'garage' && <Garage data={appData} updateData={updateData} />}
            {activeTab === 'maintenance' && <Maintenance data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'inventory' && <Inventory data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'gallery' && <Gallery data={appData} setActiveTab={setActiveTab} />}
            
            {/* Il Deep Vault con crittografia AES-256 */}
            {activeTab === 'vault' && <Vault data={appData} updateData={updateData} setActiveTab={setActiveTab} />}

            {activeTab === 'hub' && (
              <Hub 
                theme={theme} 
                toggleTheme={toggleTheme} 
                data={appData} 
                updateData={updateData} 
                setActiveTab={setActiveTab} 
              />
            )}
          </div>

          <div className="fab-container">
            <div className={`fab-menu ${isFabOpen ? 'open' : ''}`}>
              <div className="fab-item" onClick={handleTestSave}>
                {isSyncing ? "⏳ Sincronizzazione..." : "💾 TEST Salvataggio"}
              </div>
              <div className="fab-item" onClick={() => alert('Funzione Rifornimento in arrivo!')}>
                ⛽ Rifornimento
              </div>
            </div>
            <button 
              className="fab-btn" 
              onClick={() => setIsFabOpen(!isFabOpen)}
            >
              {isFabOpen ? '✕' : '＋'}
            </button>
          </div>

          <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}
    </>
  );
}

export default App;