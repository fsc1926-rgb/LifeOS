import React, { useState } from 'react';

function Maintenance({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const maintenances = data.maintenances || [];
  const CATEGORIES = ['Impianto Elettrico', 'Idraulica & Caldaia', 'Climatizzazione', 'Elettrodomestici', 'Giardino & Esterni', 'Pulizie Straordinarie', 'Tasse & Utenze', 'Altro'];

  // Stati del form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState('');
  const [recurrence, setRecurrence] = useState('Singola');
  const [status, setStatus] = useState('In attesa');
  const [notes, setNotes] = useState('');

  // Filtri
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const uid = () => 'mnt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const addMonthsISO = (dateStr, months) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d.toISOString().split('T')[0];
  };

  const spawnNextMaintenance = (m, currentData) => {
    const months = { Mensile: 1, Semestrale: 6, Annuale: 12 }[m.recurrence];
    if (!months || m.status !== 'Completata' || m.nextSpawned || !m.dueDate) return null;
    
    const next = {
      id: uid(),
      title: m.title,
      category: m.category,
      dueDate: addMonthsISO(m.dueDate, months),
      cost: m.cost,
      recurrence: m.recurrence,
      status: 'In attesa',
      notes: m.notes
    };
    m.nextSpawned = true;
    currentData.maintenances.push(next);
    return next;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    const m = { id: uid(), title, category, dueDate, cost: parseFloat(cost) || 0, recurrence, status, notes };
    const newMaintenances = [...(data.maintenances || []), m];
    const newData = { ...data, maintenances: newMaintenances };
    spawnNextMaintenance(m, newData);

    updateData(newData);
    setTitle('');
    setCost('');
    setNotes('');
    alert('Manutenzione salvata!');
  };

  const toggleStatus = (id) => {
    const newData = { ...data };
    const m = newData.maintenances.find(x => x.id === id);
    if (!m) return;
    
    m.status = m.status === 'Completata' ? 'In attesa' : 'Completata';
    const next = spawnNextMaintenance(m, newData);
    
    updateData(newData);
    if (next) alert(`Prossima scadenza creata automaticamente: ${next.dueDate.split('-').reverse().join('/')}`);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Eliminare questa manutenzione?')) return;
    const newData = { ...data };
    newData.maintenances = newData.maintenances.filter(x => x.id !== id);
    updateData(newData);
  };

  // Filtraggio
  const filtered = maintenances.filter(m => {
    if (filterCat !== 'ALL' && m.category !== filterCat) return false;
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">🔧 Scadenziario Manutenzioni</div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Torna all'Hub</button>
      </div>

      <div className="bento-grid">
        
        {/* FORM NUOVA MANUTENZIONE */}
        <div className="bento-card col-span-4">
          <div className="card-header"><div className="card-title">➕ Nuovo Intervento</div></div>
          <form onSubmit={handleAdd}>
            <input type="text" className="input" placeholder="Intervento *" value={title} onChange={e => setTitle(e.target.value)} required />
            <div className="form-row">
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div className="form-row">
              <input type="number" className="input" step="0.01" min="0" placeholder="Costo €" value={cost} onChange={e => setCost(e.target.value)} />
              <select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                <option value="Singola">Singolo</option>
                <option value="Mensile">Mensile</option>
                <option value="Semestrale">Semestrale</option>
                <option value="Annuale">Annuale</option>
              </select>
            </div>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="In attesa">⏳ In attesa</option>
              <option value="Completata">✅ Completata</option>
            </select>
            <input type="text" className="input" placeholder="Note o ricambi..." value={notes} onChange={e => setNotes(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>💾 Registra Manutenzione</button>
          </form>
          <div className="stat-label" style={{ marginTop: '0.75rem', fontSize: '0.72rem' }}>
            Gli interventi ricorrenti generano automaticamente la scadenza successiva quando completati.
          </div>
        </div>

        {/* LISTA STORICO & SCADENZE */}
        <div className="bento-card col-span-8">
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <div className="card-title">🛠️ Storico & Scadenze</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="input" style={{ margin: 0, width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="ALL">Tutte le Categorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" style={{ margin: 0, width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">Tutti gli stati</option>
                <option value="In attesa">⏳ In attesa</option>
                <option value="Completata">✅ Completate</option>
              </select>
            </div>
          </div>
          
          <div className="item-list" style={{ maxHeight: '500px' }}>
            {filtered.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem' }}>Nessuna manutenzione trovata.</div>
            ) : (
              filtered.map(m => {
                const isDone = m.status === 'Completata';
                const isOverdue = !isDone && m.dueDate < todayStr;
                return (
                  <div key={m.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }} onClick={() => toggleStatus(m.id)}>
                      <span>{isDone ? '✅' : (isOverdue ? '⚠️' : '⏳')}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                          {m.title}
                        </div>
                        <div className="stat-label" style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                          {m.dueDate.split('-').reverse().join('/')} • {m.category} ({m.recurrence})
                          {m.notes && ` • ${m.notes}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 800 }}>{m.cost > 0 ? formatCurrency(m.cost) : ''}</div>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>🗑️</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Maintenance;