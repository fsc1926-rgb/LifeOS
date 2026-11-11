import { useState } from 'react';
import './App.css';
import LockScreen from './components/LockScreen';
import Header from './components/Header';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Wallet from './components/Wallet';
import Garage from './components/Garage';
import Hub from './components/Hub';

// Importiamo il nostro nuovo motore dati!
import { DataService } from './dataService'; 

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Variabili di stato per gestire i dati scaricati dal Cloud
  const [appData, setAppData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Questa funzione scatta quando il lucchetto viene sbloccato
  const handleUnlock = async () => {
    console.log("Inizio sincronizzazione col Cloud...");
    
    // 1. Scarica e decripta i dati
    const data = await DataService.loadData();
    
    // 2. Salva i dati nella memoria dell'app
    setAppData(data);
    
    // 3. Togli il lucchetto e mostra l'app
    setIsLocked(false);
  };

  // Funzione di test per salvare dati sul Cloud
  const handleTestSave = async () => {
    setIsSyncing(true);
    // Creiamo una copia dei dati attuali per modificarli
    const newData = { ...appData };
    // Simuliamo l'aggiunta di 10€ al saldo
    newData.wallet.totalBalance += 10; 
    
    // Aggiorniamo la grafica
    setAppData(newData);
    // Salviamo sul database criptando tutto
    await DataService.saveData(newData);
    
    setIsSyncing(false);
    setIsFabOpen(false); // Chiude il menu
    alert("Dati salvati e criptati su Firebase! Controlla la console.");
  };

  return (
    <>
      {isLocked ? (
        <LockScreen onUnlock={handleUnlock} />
      ) : (
        <>
          <Header />
          
          <div className="main-container">
            {/* Ora possiamo passare i dati scaricati ai nostri componenti! */}
            {activeTab === 'dashboard' && <Dashboard data={appData} />}
            {activeTab === 'wallet' && <Wallet data={appData} />}
            {activeTab === 'garage' && <Garage data={appData} />}
            {activeTab === 'hub' && <Hub data={appData} />}
          </div>

          <div className="fab-container">
            <div className={`fab-menu ${isFabOpen ? 'open' : ''}`}>
              <div className="fab-item" onClick={handleTestSave}>
                {isSyncing ? "⏳ Sincronizzazione..." : "💾 TEST Salvataggio Cloud"}
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