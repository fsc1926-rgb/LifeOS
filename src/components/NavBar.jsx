import React from 'react';

function NavBar({ activeTab, setActiveTab }) {
  return (
    <div className="nav-tabs">
      <button 
        className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} 
        onClick={() => setActiveTab('dashboard')}
      >
        📊 Dashboard
      </button>
      <button 
        className={`nav-tab ${activeTab === 'wallet' ? 'active' : ''}`} 
        onClick={() => setActiveTab('wallet')}
      >
        💳 Wallet
      </button>
      <button 
        className={`nav-tab ${activeTab === 'garage' ? 'active' : ''}`} 
        onClick={() => setActiveTab('garage')}
      >
        🚘 Garage
      </button>
      <button 
        className={`nav-tab ${activeTab === 'hub' ? 'active' : ''}`} 
        onClick={() => setActiveTab('hub')}
      >
        🧩 Hub
      </button>
    </div>
  );
}

export default NavBar;