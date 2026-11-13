import React, { useState, useEffect } from 'react';
import './app.css';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Wallet from './components/Wallet';
import Hub from './components/Hub';
import Garage from './components/Garage';
import Maintenance from './components/Maintenance';
import Inventory from './components/Inventory';
import Health from './components/Health';
import Vault from './components/Vault';

const DOC_REF = doc(db, 'lifeos', 'user_data');
const LOCAL_STORAGE_KEY = 'LIFEOS_DATA_BACKUP';

const DEFAULT_DATA = {
  settings: {
    theme: 'dark',
    vaultCheck: null,
    vaultSalt: null,
    walletCategories: ['Rifornimento', 'Spesa', 'Farmaci', 'Svago', 'Stipendio/Entrate', 'Bollette'],
    garageCategories: ['Rifornimento', 'Assicurazione', 'Bollo', 'Tagliando', 'Revisione', 'Gomme', 'Lavaggio', 'Altro'],
    inventoryCategories: ['Elettronica', 'Elettrodomestici', 'Mobili', 'Hobby/Sport', 'Documenti', 'Altro']
  },
  accounts: [{ id: 'acc_1', name: 'Conto Principale', balance: 0 }],
  transactions: [],
  tasks: [],
  garage: [],
  vehicleDeadlines: { insurance: '', tax: '', inspection: '' },
  maintenances: [],
  inventory: [],
  weights: [],
  medical: [],
  vault: [],
  vaultNotes: null
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [appData, setAppData] = useState(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
  }, [theme]);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        let loaded = null;
        try {
          const snap = await getDoc(DOC_REF);
          if (snap.exists()) {
            loaded = snap.data();
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loaded));
          }
        } catch (cloudErr) {
          console.warn('Cloud non raggiungibile, uso cache locale:', cloudErr);
        }

        if (!loaded) {
          const local = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (local) loaded = JSON.parse(local);
        }

        if (loaded) {
          const safeData = {
            ...DEFAULT_DATA,
            ...loaded,
            settings: { ...DEFAULT_DATA.settings, ...(loaded.settings || {}) },
            accounts: Array.isArray(loaded.accounts) && loaded.accounts.length > 0 
              ? loaded.accounts 
              : DEFAULT_DATA.accounts,
            transactions: Array.isArray(loaded.transactions) ? loaded.transactions : [],
            tasks: Array.isArray(loaded.tasks) ? loaded.tasks : [],
            garage: Array.isArray(loaded.garage) ? loaded.garage : [],
            vehicleDeadlines: loaded.vehicleDeadlines || DEFAULT_DATA.vehicleDeadlines,
            maintenances: Array.isArray(loaded.maintenances) ? loaded.maintenances : [],
            inventory: Array.isArray(loaded.inventory) ? loaded.inventory : [],
            weights: Array.isArray(loaded.weights) ? loaded.weights : [],
            medical: Array.isArray(loaded.medical) ? loaded.medical : [],
            vault: Array.isArray(loaded.vault) ? loaded.vault : []
          };
          setAppData(safeData);
          if (safeData.settings?.theme) setTheme(safeData.settings.theme);
        }
      } catch (err) {
        console.error('Errore avvio:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const updateData = async (newData) => {
    setAppData(newData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    try {
      await setDoc(DOC_REF, newData, { merge: true });
    } catch (e) {
      console.warn('Errore salvataggio Cloud:', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    updateData({
      ...appData,
      settings: { ...(appData.settings || {}), theme: nextTheme }
    });
  };

  const navBtnStyle = (isActive) => ({
    flex: 1,
    padding: '0.65rem 1rem',
    borderRadius: '12px',
    border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
    background: isActive ? 'linear-gradient(90deg, #8b5cf6, #ec4899)' : '#131b2e',
    color: '#f8fafc',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s ease'
  });

  const isHubSection = ['hub', 'garage', 'maintenance', 'inventory', 'health', 'vault'].includes(activeTab);

  return (
    <div className="app-container" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* HEADER SUPERIORE */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.85rem 2rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 900
      }}>
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '34px', 
            height: '34px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 900, 
            color: 'white' 
          }}>
            L
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f8fafc' }}>LifeOS</span>
        </div>
      </header>

      {/* CONTENUTO MODULI */}
      <main className="main-content" style={{ maxWidth: '980px', margin: '1.5rem auto', padding: '0 1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Caricamento...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'calendar' && <Calendar data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'wallet' && <Wallet data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'hub' && <Hub theme={theme} toggleTheme={toggleTheme} data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'garage' && <Garage data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'maintenance' && <Maintenance data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'inventory' && <Inventory data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'health' && <Health data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
            {activeTab === 'vault' && <Vault data={appData} updateData={updateData} setActiveTab={setActiveTab} />}
          </>
        )}
      </main>

      {/* PULSANTE FLOTTANTE (+) IN BASSO A DESTRA */}
      <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 999 }}>
        {fabOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
            <button className="btn btn-sm" onClick={() => { setActiveTab('wallet'); setFabOpen(false); }}>💸 Nuova Spesa</button>
            <button className="btn btn-sm" onClick={() => { setActiveTab('calendar'); setFabOpen(false); }}>📅 Nuovo Task</button>
            <button className="btn btn-sm" onClick={() => { setActiveTab('garage'); setFabOpen(false); }}>⛽ Rifornimento</button>
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: 'white',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {fabOpen ? '×' : '+'}
        </button>
      </div>

      {/* BARRA MENU INFERIORE STILIZZATA */}
      <nav style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.75rem',
        width: '92%',
        maxWidth: '900px',
        background: 'rgba(11, 15, 25, 0.92)',
        backdropFilter: 'blur(12px)',
        padding: '0.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        zIndex: 990
      }}>
        <button style={navBtnStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
          🏠 Dashboard
        </button>
        <button style={navBtnStyle(activeTab === 'calendar')} onClick={() => setActiveTab('calendar')}>
          📅 Agenda
        </button>
        <button style={navBtnStyle(activeTab === 'wallet')} onClick={() => setActiveTab('wallet')}>
          💳 Finanze
        </button>
        <button style={navBtnStyle(isHubSection)} onClick={() => setActiveTab('hub')}>
          ⚡ Hub Extra
        </button>
      </nav>

    </div>
  );
}

export default App;