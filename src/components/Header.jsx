import React from 'react';

function Header() {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand">
          <div className="brand-logo">L</div>
          LifeOS
        </div>
        {/* Qui in futuro rimetteremo l'icona del Cloud Sync */}
      </div>
    </header>
  );
}

export default Header;