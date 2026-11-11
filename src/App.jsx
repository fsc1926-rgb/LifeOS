import { useState } from 'react';
import './App.css';
import LockScreen from './components/LockScreen';
import Header from './components/Header';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Wallet from './components/Wallet';
import Garage from './components/Garage';
import Hub from './components/Hub';

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFabOpen, setIsFabOpen] = useState(false); // Gestisce il menu del pulsante fluttuante

  return (
    <>
      {isLocked ? (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      ) : (
        <>
          <Header />
          
          <div className="main-container">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'wallet' && <Wallet />}
            {activeTab === 'garage' && <Garage />}
            {activeTab === 'hub' && <Hub />}
          </div>

          {/* Pulsante Fluttuante (FAB) */}
          <div className="fab-container">
            <div className={`fab-menu ${isFabOpen ? 'open' : ''}`}>
              <div className="fab-item">➕ Nuova Spesa</div>
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