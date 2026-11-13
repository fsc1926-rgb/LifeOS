import React, { useState } from 'react';
import SwipeableRow from './SwipeableRow';

function Inventory({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const inventory = data.inventory || [];
  const customCategories = data.settings?.inventoryCategories || ['Elettronica', 'Elettrodomestici', 'Mobili', 'Hobby/Sport', 'Documenti', 'Altro'];

  const [name, setName] = useState('');
  const [category, setCategory] = useState(customCategories[0]);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(24);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  const uid = () => 'inv_' + Date.now().toString(36);

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      const newCat = window.prompt('Inserisci il nome della nuova categoria di oggetti:');
      if (newCat && newCat.trim() !== '') {
        const newData = { ...data };
        if (!newData.settings) newData.settings = {};
        newData.settings.inventoryCategories = [...customCategories, newCat.trim()];
        updateData(newData);
        setCategory(newCat.trim());
      }
    } else {
      setCategory(val);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;
    const newData = { ...data };
    if (!newData.inventory) newData.inventory = [];
    
    newData.inventory.unshift({
      id: uid(),
      name,
      category,
      purchaseDate,
      warrantyMonths: parseInt(warrantyMonths) || 0,
      price: parseFloat(price) || 0,
      notes
    });
    updateData(newData);
    setName(''); setPrice(''); setNotes('');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Eliminare questo oggetto?')) return;
    const newData = { ...data };
    newData.inventory = newData.inventory.filter(i => i.id !== id);
    updateData(newData);
  };

  // Calcolo scadenza garanzia
  const getWarrantyStatus = (dateStr, months) => {
    if (!dateStr || !months) return { text: 'N/A', color: 'var(--text-muted)' };
    const pDate = new Date(dateStr);
    const expDate = new Date(pDate.setMonth(pDate.getMonth() + months));
    const now = new Date();
    const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Scaduta (${expDate.toLocaleDateString()})`, color: 'var(--danger)' };
    if (diffDays < 30) return { text: `In scadenza (${expDate.toLocaleDateString()})`, color: 'var(--warning)' };
    return { text: `Attiva fino al ${expDate.toLocaleDateString()}`, color: 'var(--success)' };
  };

  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">📦 Inventario & Garanzie</div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Hub</button>
      </div>

      <div className="bento-grid">
        <div className="bento-card col-span-5">
          <div className="card-header"><div className="card-title">➕ Aggiungi Oggetto</div></div>
          <form onSubmit={handleAdd}>
            <input type="text" className="input" placeholder="Nome Oggetto *" value={name} onChange={e => setName(e.target.value)} required style={{ marginBottom: '0.5rem' }} />
            
            <select className="input" value={category} onChange={handleCategoryChange} style={{ marginBottom: '0.5rem' }}>
              {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>➕ Aggiungi Nuova Categoria...</option>
            </select>

            <div className="form-row">
              <div style={{ flex: 1 }}>
                <div className="stat-label">Data Acquisto</div>
                <input type="date" className="input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="stat-label">Garanzia (Mesi)</div>
                <input type="number" className="input" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} min="0" />
              </div>
            </div>
            
            <input type="number" className="input" step="0.01" placeholder="Valore € (Opzionale)" value={price} onChange={e => setPrice(e.target.value)} style={{ marginBottom: '0.5rem' }} />
            <input type="text" className="input" placeholder="Note / Seriale" value={notes} onChange={e => setNotes(e.target.value)} style={{ marginBottom: '1rem' }} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salva in Inventario</button>
          </form>
        </div>

        <div className="bento-card col-span-7">
          <div className="card-header"><div className="card-title">📋 I Tuoi Beni</div></div>
          <input type="text" className="input" placeholder="🔍 Cerca per nome o categoria..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem', borderRadius: '20px' }} />
          
          <div className="item-list" style={{ maxHeight: '400px' }}>
            {filteredItems.length === 0 ? <div className="stat-label" style={{textAlign:'center', padding:'1rem'}}>Nessun oggetto trovato.</div> :
              filteredItems.map(i => {
                const wStatus = getWarrantyStatus(i.purchaseDate, i.warrantyMonths);
                return (
                  <SwipeableRow key={i.id} onDelete={() => handleDelete(i.id)}>
                    <div className="list-row" style={{ margin: 0, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{i.name} {i.price ? `(€${i.price})` : ''}</div>
                        <div className="stat-label" style={{ marginTop: '0.2rem' }}>{i.category} {i.notes ? `• ${i.notes}` : ''}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: wStatus.color, fontWeight: 600 }}>🛡️ Garanzia: {wStatus.text}</div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i.id)}>🗑️</button>
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

export default Inventory;