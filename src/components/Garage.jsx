import React, { useState } from 'react';
import SwipeableRow from './SwipeableRow';

function Garage({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const garage = Array.isArray(data.garage) ? data.garage : [];
  
  // Scadenze veicolo per il Semaforo (salvate in data.vehicleDeadlines)
  const deadlines = data.vehicleDeadlines || {
    insurance: '',
    tax: '',
    inspection: ''
  };

  const customCategories = (data.settings && data.settings.garageCategories) 
    ? data.settings.garageCategories 
    : ['Rifornimento', 'Assicurazione', 'Bollo', 'Tagliando', 'Revisione', 'Gomme', 'Lavaggio', 'Altro'];

  const [type, setType] = useState(customCategories[0]);
  const [cost, setCost] = useState('');
  const [liters, setLiters] = useState('');
  const [km, setKm] = useState('');
  const [notes, setNotes] = useState('');
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [editDeadlines, setEditDeadlines] = useState(false);

  const [insDate, setInsDate] = useState(deadlines.insurance || '');
  const [taxDate, setTaxDate] = useState(deadlines.tax || '');
  const [inspDate, setInspDate] = useState(deadlines.inspection || '');

  const uid = () => 'gar_' + Date.now().toString(36);

  const handleBackToHub = () => setActiveTab('hub');

  // Calcolo stato semaforo per ogni scadenza
  const getTrafficLight = (dateStr) => {
    if (!dateStr) {
      return { icon: '⚪', label: 'Non impostata', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        icon: '🔴', 
        label: `Scaduta da ${Math.abs(diffDays)} gg`, 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.15)' 
      };
    }
    if (diffDays <= 30) {
      return { 
        icon: '🟡', 
        label: `Scade tra ${diffDays} gg`, 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.15)' 
      };
    }
    return { 
      icon: '🟢', 
      label: `OK (${diffDays} gg)`, 
      color: '#10b981', 
      bg: 'rgba(16, 185, 129, 0.15)' 
    };
  };

  const handleSaveDeadlines = (e) => {
    e.preventDefault();
    const newData = {
      ...data,
      vehicleDeadlines: {
        insurance: insDate,
        tax: taxDate,
        inspection: inspDate
      }
    };
    updateData(newData);
    setEditDeadlines(false);
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      const newCat = window.prompt('Inserisci il nome della nuova spesa auto:');
      if (newCat && newCat.trim() !== '') {
        const newData = { ...data };
        if (!newData.settings) newData.settings = {};
        newData.settings.garageCategories = [...customCategories, newCat.trim()];
        updateData(newData);
        setType(newCat.trim());
      }
    } else {
      setType(val);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!type) return;

    const newData = { ...data };
    if (!Array.isArray(newData.garage)) newData.garage = [];
    const importo = parseFloat(cost) || 0;

    newData.garage.unshift({
      id: uid(),
      date: refDate,
      type,
      cost: importo,
      liters: parseFloat(liters) || 0,
      km: parseInt(km) || 0,
      notes: notes || ''
    });

    if (importo > 0 && Array.isArray(newData.accounts) && newData.accounts.length > 0) {
      newData.accounts[0].balance -= importo;
      if (!Array.isArray(newData.transactions)) newData.transactions = [];
      newData.transactions.unshift({
        id: 'trx_' + Date.now(),
        accountId: newData.accounts[0].id,
        amount: -importo,
        type: 'Uscita',
        category: type === 'Rifornimento' ? 'Rifornimento' : 'Auto & Veicoli', 
        description: `🚗 Garage: ${type} ${notes ? '('+notes+')' : ''}`,
        date: refDate
      });
      alert('Operazione salvata e registrata automaticamente nel Wallet! ⛽');
    } else {
      alert('Operazione salvata!');
    }

    updateData(newData);
    setCost(''); setLiters(''); setKm(''); setNotes('');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Eliminare questo record dal Garage?')) return;
    const newData = { ...data };
    newData.garage = garage.filter(g => g.id !== id);
    updateData(newData);
  };

  const refuelings = garage.filter(g => g && g.type === 'Rifornimento');
  const totalFuelCost = refuelings.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
  const totalLiters = refuelings.reduce((sum, r) => sum + (parseFloat(r.liters) || 0), 0);

  const semaphoreItems = [
    { key: 'insurance', title: '🛡️ Assicurazione', date: deadlines.insurance },
    { key: 'tax', title: '📄 Bollo Auto', date: deadlines.tax },
    { key: 'inspection', title: '🔧 Revisione', date: deadlines.inspection }
  ];

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">🚗 Garage & Veicoli</div>
        <button type="button" className="btn btn-sm" onClick={handleBackToHub}>← Torna all'Hub</button>
      </div>

      <div className="bento-grid">
        
        {/* 🚦 SEMAFORO SCADENZE VEICOLO */}
        <div className="bento-card col-span-12">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div className="card-title">🚦 Semaforo Scadenze Veicolo</div>
            <button type="button" className="btn btn-sm" onClick={() => setEditDeadlines(!editDeadlines)}>
              {editDeadlines ? 'Chiudi' : '✏️ Imposta Scadenze'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {semaphoreItems.map(item => {
              const status = getTrafficLight(item.date);
              return (
                <div key={item.key} style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: status.bg, 
                  border: `1px solid ${status.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</div>
                    <div className="stat-label" style={{ marginTop: '0.2rem' }}>
                      {item.date ? item.date.split('-').reverse().join('/') : 'Nessuna data'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem' }}>{status.icon}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: status.color }}>{status.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {editDeadlines && (
            <form onSubmit={handleSaveDeadlines} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div className="form-row">
                <div style={{ flex: 1 }}>
                  <div className="stat-label">Scadenza Assicurazione</div>
                  <input type="date" className="input" value={insDate} onChange={e => setInsDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="stat-label">Scadenza Bollo</div>
                  <input type="date" className="input" value={taxDate} onChange={e => setTaxDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="stat-label">Scadenza Revisione</div>
                  <input type="date" className="input" value={inspDate} onChange={e => setInspDate(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '0.5rem' }}>
                💾 Salva Scadenze Semaforo
              </button>
            </form>
          )}
        </div>

        {/* 🏎️ CRUSCOTTO RIFORNIMENTI */}
        <div className="bento-card col-span-12" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <div className="card-header"><div className="card-title" style={{ color: 'var(--accent-primary)' }}>🏎️ Cruscotto Rifornimenti</div></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '12px', marginBottom: '1rem' }}>
            <div>
              <div className="stat-label">Spesa Carburante Tot.</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>€ {totalFuelCost.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="stat-label">Litri Totali</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{totalLiters.toFixed(1)} L</div>
            </div>
          </div>

          <div className="card-title" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>STORICO RIFORNIMENTI</div>
          <div className="item-list" style={{ maxHeight: '200px', background: 'transparent' }}>
            {refuelings.length === 0 ? <div className="stat-label">Nessun rifornimento registrato.</div> : 
              refuelings.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{r.date ? r.date.split('-').reverse().join('/') : ''}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.km ? `${r.km} km` : 'Km non inseriti'}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700 }}>
                    € {(parseFloat(r.cost) || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({r.liters || 0}L)</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* ➕ AGGIUNGI SPESA / RIFORNIMENTO */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">➕ Registra Operazione Veicolo</div></div>
          <form onSubmit={handleAdd} style={{ marginBottom: '2rem' }}>
            <select className="input" value={type} onChange={handleCategoryChange} style={{ marginBottom: '0.5rem' }}>
              {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>➕ Aggiungi Nuova Categoria...</option>
            </select>
            
            <div className="form-row">
              <input type="number" step="0.01" className="input" placeholder="Costo Totale €" value={cost} onChange={e => setCost(e.target.value)} required />
              <input type="date" className="input" value={refDate} onChange={e => setRefDate(e.target.value)} required />
            </div>

            {type === 'Rifornimento' && (
              <div className="form-row" style={{ marginTop: '0.5rem' }}>
                <input type="number" step="0.1" className="input" placeholder="Litri Erogati" value={liters} onChange={e => setLiters(e.target.value)} required />
                <input type="number" className="input" placeholder="Chilometraggio (Km)" value={km} onChange={e => setKm(e.target.value)} />
              </div>
            )}
            
            <input type="text" className="input" placeholder="Note / Distributore / Officina" value={notes} onChange={e => setNotes(e.target.value)} style={{ marginTop: '0.5rem', marginBottom: '1rem' }} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salva in Garage e Invia al Wallet</button>
          </form>

          <div className="card-header"><div className="card-title">📜 Registro Completo Interventi</div></div>
          <div className="item-list" style={{ maxHeight: '250px' }}>
            {garage.length === 0 ? <div className="stat-label">Nessun record.</div> :
              garage.map(g => {
                if (!g) return null;
                const catStr = g.type || 'Sconosciuto';
                const dateStr = g.date ? g.date.split('-').reverse().join('/') : '';
                const noteStr = g.notes || '';
                
                return (
                  <SwipeableRow key={g.id} onDelete={() => handleDelete(g.id)}>
                    <div className="list-row" style={{ margin: 0, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{catStr} {g.cost ? `(€${g.cost})` : ''}</div>
                        <div className="stat-label">{dateStr} {noteStr ? `• ${noteStr}` : ''}</div>
                      </div>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(g.id)}>🗑️</button>
                    </div>
                  </SwipeableRow>
                );
              })
            }
          </div>
        </div>

      </div>
    </div>
  );
}

export default Garage;