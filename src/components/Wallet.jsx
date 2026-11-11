import React from 'react';

function Wallet() {
  return (
    <div className="module-section active">
      <div className="bento-grid">
        <div className="bento-card col-span-12">
          <div className="card-header">
            <h2 className="card-title">💳 I Tuoi Conti</h2>
          </div>
          
          <div className="wallet-carousel">
            {/* Card Totale */}
            <div className="wallet-card wallet-card-all selected">
              <div style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 600 }}>Saldo Totale</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 'auto' }}>€ 0,00</div>
            </div>
            
            {/* Card Conto 1 */}
            <div className="wallet-card wallet-card-0">
              <div style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 600 }}>Conto Principale</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 'auto' }}>€ 0,00</div>
            </div>
          </div>

          <div className="wallet-actions-grid">
            <button className="btn btn-primary">➕ Aggiungi Transazione</button>
            <button className="btn">Storico Movimenti</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;