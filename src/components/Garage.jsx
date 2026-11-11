import React from 'react';

function Garage() {
  return (
    <div className="module-section active">
      <div className="bento-grid">
        <div className="bento-card col-span-12">
          
          <div className="vehicle-selector">
            <div className="vehicle-chip active">Auto Principale</div>
            <div className="vehicle-chip">Moto</div>
          </div>

          <div className="garage-car-header">
            <div>
              <div className="car-brand-title">La mia Auto</div>
              <div className="car-plate">AB 123 CD</div>
            </div>
          </div>

          <div className="traffic-light-grid">
            <div className="tl-card">
              <div className="tl-indicator tl-green"></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Assicurazione</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Valida</span>
            </div>
            <div className="tl-card">
              <div className="tl-indicator tl-yellow"></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Tagliando</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>In scadenza</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Garage;