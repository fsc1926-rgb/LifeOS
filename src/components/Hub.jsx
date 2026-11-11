import React from 'react';

function Hub() {
  return (
    <div className="module-section active">
      <div className="bento-grid">
        <div className="bento-card col-span-12">
          <div className="card-header">
            <h2 className="card-title">🧩 Hub & Impostazioni</h2>
          </div>
          
          <div className="hub-grid">
            <div className="hub-card">
              <div className="hub-icon">⚙️</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Generali</div>
            </div>
            <div className="hub-card">
              <div className="hub-icon">☁️</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cloud Sync</div>
            </div>
            <div className="hub-card">
              <div className="hub-icon">🎨</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Aspetto</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Hub;