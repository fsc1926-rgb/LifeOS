import React from 'react';

function Gallery({ data, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">🖼️ Smart Media Hub</div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Torna all'Hub</button>
      </div>
      
      <div className="bento-card col-span-12">
        <div className="stat-label" style={{ marginBottom: '1rem' }}>
          Qui troverai tutte le foto degli scontrini, referti e garanzie caricati nell'ecosistema. (Upload file in arrivo nelle prossime versioni!)
        </div>
        
        <div className="gallery-grid sensitive">
          <div className="stat-label" style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
            Nessun file multimediale presente al momento.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;