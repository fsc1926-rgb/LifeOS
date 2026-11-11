import { useState, useEffect } from 'react';
import './App.css';
import LockScreen from './components/LockScreen';
import Header from './components/Header';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Wallet from './components/Wallet';
import Garage from './components/Garage';
import Hub from './components/Hub';

// Motore dati e crittografia
import { DataService } from './dataService'; 

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Stati dei dati e del caricamento
  const [appData, setAppData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Stato del Tema
  const [theme, setTheme] = useState('dark');

  // Applica il tema al documento HTML ogni volta che cambia
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Funzione per alternare i temi
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Funzione universale per aggiornare i dati in memoria e salvare su Firebase
  const updateData = async (newData) => {
    setAppData(newData);
    await DataService.saveData(newData);
  };

  // Logica di sblocco e caricamento dati
  const handleUnlock = async () => {
    console.log("Inizio sincronizzazione col Cloud...");
    
    const data = await DataService.loadData();
    setAppData(data);
    
    // Se c'era un tema salvato nei dati, lo applichiamo
    if (data?.settings?.theme) {
      setTheme(data.settings.theme);
    }
    
    setIsLocked(false);
  };

  // Funzione di test per salvare dati sul Cloud tramite il pulsante fluttuante
  const handleTestSave = async () => {
    setIsSyncing(true);
    const newData = { ...appData };
    
    // Simuliamo l'aggiunta di 10€ al Conto Principale
    if (newData.accounts && newData.accounts.length > 0) {
      newData.accounts[0].balance += 10;
    }
    // Salviamo anche il tema attuale
    newData.settings.theme = theme;
    
    setAppData(newData);
    await DataService.saveData(newData);
    
    setIsSyncing(false);
    setIsFabOpen(false); // Chiude il menu
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
            {/* Passiamo i dati e la funzione di aggiornamento ai moduli */}
            {activeTab === 'dashboard' && <Dashboard data={appData} updateData={updateData} />}
            {activeTab === 'wallet' && <Wallet data={appData} updateData={updateData} />}
            {activeTab === 'garage' && <Garage data={appData} updateData={updateData} />}
            
            {/* Passiamo la gestione del tema all'Hub */}
            {activeTab === 'hub' && <Hub theme={theme} toggleTheme={toggleTheme} data={appData} updateData={updateData} />}
          </div>

          {/* Pulsante Fluttuante (FAB) */}
          <div className="fab-container">
            <div className={`fab-menu ${isFabOpen ? 'open' : ''}`}>
              <div className="fab-item" onClick={handleTestSave}>
                {isSyncing ? "⏳ Sincronizzazione..." : "💾 TEST Salvataggio"}
              </div>
              <div className="fab-item">⛽ Rifornimento</div>
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