import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

import ErrorBoundary from './components/ErrorBoundary';
import LockScreen from './components/LockScreen';
import SearchModal from './components/SearchModal';
import SmartFAB from './components/SmartFAB';
import AnimatedPage from './components/AnimatedPage';

// Lazy-loaded modules for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Calendar = lazy(() => import('./components/Calendar'));
const Wallet = lazy(() => import('./components/Wallet'));
const Hub = lazy(() => import('./components/Hub'));
const Garage = lazy(() => import('./components/Garage'));
const Maintenance = lazy(() => import('./components/Maintenance'));
const Inventory = lazy(() => import('./components/Inventory'));
const Health = lazy(() => import('./components/Health'));
const Vault = lazy(() => import('./components/Vault'));

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
  habits: [],
  garage: [],
  vehicleDeadlines: { insurance: '', tax: '', inspection: '' },
  maintenances: [],
  inventory: [],
  weights: [],
  medical: [],
  vault: [],
  vaultNotes: null
};

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner-dot" />
    <span>Caricamento modulo...</span>
  </div>
);

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [appData, setAppData] = useState(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

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
            habits: Array.isArray(loaded.habits) ? loaded.habits : [],
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

  const isHubSection = ['hub', 'garage', 'maintenance', 'inventory', 'health', 'vault'].includes(activeTab);

  // Lock screen
  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  const renderActiveModule = () => {
    const commonProps = { data: appData, updateData, setActiveTab };

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} />;
      case 'calendar':  return <Calendar {...commonProps} />;
      case 'wallet':    return <Wallet {...commonProps} />;
      case 'hub':       return <Hub theme={theme} toggleTheme={toggleTheme} {...commonProps} />;
      case 'garage':    return <Garage {...commonProps} />;
      case 'maintenance': return <Maintenance {...commonProps} />;
      case 'inventory': return <Inventory {...commonProps} />;
      case 'health':    return <Health {...commonProps} />;
      case 'vault':     return <Vault {...commonProps} />;
      default:          return <Dashboard {...commonProps} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container">

        {/* HEADER */}
        <header className="app-header">
          <div className="header-top">
            <div
              className="brand"
              onClick={() => setActiveTab('dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <div className="brand-logo">L</div>
              LifeOS
            </div>
          </div>
        </header>

        {/* CONTENUTO PRINCIPALE */}
        <main className="main-container">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatedPage key={activeTab}>
                {renderActiveModule()}
              </AnimatedPage>
            </Suspense>
          )}
        </main>

        {/* RICERCA GLOBALE (Ctrl+K) */}
        <SearchModal data={appData} setActiveTab={setActiveTab} />

        {/* FAB AZIONI RAPIDE */}
        <SmartFAB setActiveTab={setActiveTab} />

        {/* BARRA NAVIGAZIONE INFERIORE */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            🏠 Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Agenda
          </button>
          <button
            className={`nav-tab ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            💳 Finanze
          </button>
          <button
            className={`nav-tab ${isHubSection ? 'active' : ''}`}
            onClick={() => setActiveTab('hub')}
          >
            ⚡ Hub Extra
          </button>
        </nav>

      </div>
    </ErrorBoundary>
  );
}

export default App;
