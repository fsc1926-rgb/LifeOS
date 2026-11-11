import React from 'react';

function NavBar({ activeTab, setActiveTab }) {
  return (
    <nav className="nav-tabs">
      <button 
        className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        🏠 Dashboard
      </button>
      
      {/* Sostituito Garage con Calendar */}
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
        className={`nav-tab ${activeTab === 'hub' ? 'active' : ''}`}
        onClick={() => setActiveTab('hub')}
      >
        ⚡ Hub Extra
      </button>
    </nav>
  );
}

export default NavBar;