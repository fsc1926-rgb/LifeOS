import React, { useState } from 'react';

function Garage({ data, updateData }) {
  if (!data || !data.vehicles) return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento...</div>;

  const vehicles = data.vehicles;
  const [activeVid, setActiveVid] = useState(data.activeVehicleId || vehicles[0]?.id);

  // Trova il veicolo attualmente selezionato
  const activeVehicle = vehicles.find(v => v.id === activeVid) || vehicles[0];

  // Utility date per i semafori
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);

  const getTrafficLight = (dateStr) => {
    if (!dateStr) return { color: 'tl-grey', text: 'Non impostata', label: '--/--/----' };
    
    const targetDate = new Date(dateStr);
    const diffTime = targetDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = dateStr.split('-').reverse().join('/');

    if (diffDays < 0) return { color: 'tl-red', text: 'Scaduta', label: formattedDate };
    if (diffDays <= 30) return { color: 'tl-yellow', text: `In scadenza (${diffDays}g)`, label: formattedDate };
    return { color: 'tl-green', text: 'Valida', label: formattedDate };
  };

  const statusAssic = getTrafficLight(activeVehicle?.assicurazione);
  const statusBollo = getTrafficLight(activeVehicle?.bollo);
  const statusRevis = getTrafficLight(activeVehicle?.revisione);

  // Funzione per aggiornare i km
  const handleUpdateKm = () => {
    const currentKm = activeVehicle?.km || 0;
    const val = window.prompt('Inserisci i chilometri attuali del veicolo:', currentKm);
    if (val === null) return;
    
    const newKm = parseInt(String(val).replace(/\D/g, ''), 10);
    if (isNaN(newKm)) return alert('Valore non valido');
    if (newKm < currentKm && !window.confirm('Il valore è inferiore al chilometraggio attuale. Confermi?')) return;

    const newData = { ...data };
    const vIndex = newData.vehicles.findIndex(v => v.id === activeVid);
    if (vIndex !== -1) {
      newData.vehicles[vIndex].km = newKm;
      updateData(newData);
    }
  };

  if (!activeVehicle) return <div>Nessun veicolo configurato.</div>;

  return (
    <div className="module-section active">
      
      {/* SELETTORE VEICOLI */}
      <div className="vehicle-selector" style={{ marginBottom: '1rem' }}>
        {vehicles.map(v => (
          <div 
            key={v.id} 
            className={`vehicle-chip ${v.id === activeVid ? 'active' : ''}`}
            onClick={() => setActiveVid(v.id)}
          >
            🚘 {v.name}
          </div>
        ))}
      </div>

      <div className="bento-grid">
        
        {/* HEADER AUTO */}
        <div className="col-span-12">
          <div className="garage-car-header">
            <div>
              <div className="stat-label" style={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Veicolo Selezionato
              </div>
              <div className="car-brand-title">{activeVehicle.name}</div>
              <div className="car-plate">{activeVehicle.plate || '--'}</div>
            </div>
            <div style={{ zIndex: 1 }}>
              <button 
                className="btn btn-sm btn-primary" 
                onClick={() => alert("Il form di configurazione veicolo arriverà presto!")}
              >
                ⚙️ Configura
              </button>
            </div>
          </div>
        </div>

        {/* SEMAFORI SCADENZE */}
        <div className="bento-card col-span-12">
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div className="card-title">🚦 Semafori Scadenze</div>
          </div>
          <div className="traffic-light-grid">
            <div className="tl-card">
              <div className={`tl-indicator ${statusAssic.color}`}></div>
              <strong style={{ fontSize: '0.9rem' }}>Assicurazione</strong>
              <div className="stat-label">{statusAssic.text}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{statusAssic.label}</div>
            </div>
            <div className="tl-card">
              <div className={`tl-indicator ${statusBollo.color}`}></div>
              <strong style={{ fontSize: '0.9rem' }}>Bollo</strong>
              <div className="stat-label">{statusBollo.text}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{statusBollo.label}</div>
            </div>
            <div className="tl-card">
              <div className={`tl-indicator ${statusRevis.color}`}></div>
              <strong style={{ fontSize: '0.9rem' }}>Revisione</strong>
              <div className="stat-label">{statusRevis.text}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{statusRevis.label}</div>
            </div>
          </div>
        </div>

        {/* CHILOMETRI */}
        <div className="bento-card col-span-12">
          <div className="card-header">
            <div className="card-title">⛽ Consumi & Chilometri</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div className="stat-label">Chilometri Attuali</div>
              <div className="stat-value" style={{ fontSize: '1.6rem' }}>
                {(activeVehicle.km || 0).toLocaleString('it-IT')} km
              </div>
            </div>
            <button className="btn btn-sm" onClick={handleUpdateKm}>Aggiorna</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Garage;