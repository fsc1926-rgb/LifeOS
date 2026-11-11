import { useState } from 'react';
import './App.css';
import LockScreen from './components/LockScreen';

function App() {
  // Questa variabile dice a React se l'app è bloccata o no. All'avvio è "true".
  const [isLocked, setIsLocked] = useState(true);

  return (
    <div className="main-container">
      {isLocked ? (
        // Se isLocked è true, mostra la schermata di blocco
        <LockScreen onUnlock={() => setIsLocked(false)} />
      ) : (
        // Se isLocked è false, mostra la dashboard
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Benvenuto in LifeOS 🚀</h1>
          <p>La tua dashboard apparirà qui.</p>
        </div>
      )}
    </div>
  );
}

export default App;