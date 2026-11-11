import React, { useState } from 'react';

const CATEGORIES = {
  'Elettronica': ['Smartphone & Tablet', 'PC & Accessori', 'Audio & TV', 'Fotografia', 'Domotica'],
  'Casa & Arredo': ['Elettrodomestici', 'Mobili', 'Cucina', 'Illuminazione', 'Fai da te'],
  'Abbigliamento': ['Giacche & Cappotti', 'Scarpe', 'Accessori & Orologi', 'Sportivo'],
  'Documenti & Valori': ['Contratti', 'Certificati', 'Gioielli', 'Collezionismo'],
  'Altro': ['Generico', 'Sport & Tempo Libero', 'Viaggi']
};

function Inventory({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const inventory = data.inventory || [];
  
  const [tab, setTab] = useState('archivio');
  
  // Form State
  const [type, setType] = useState('Archivio');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elettronica');
  const [subcategory, setSubcategory] = useState(CATEGORIES['Elettronica'][0]);
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyDate, setWarrantyDate] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const uid = () => 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    setSubcategory(CATEGORIES[cat][0]);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (warrantyDate && buyDate && warrantyDate < buyDate) {
      return alert('La fine garanzia è precedente alla data di acquisto!');
    }

    const newData = { ...data };
    newData.inventory.unshift({
      id: uid(), type, name, category, subcategory, 
      date: buyDate, warranty: warrantyDate, 
      price: parseFloat(price) || 0, notes, photo: null
    });

    updateData(newData);
    setName('');
    setPrice('');
    setNotes('');
    setWarrantyDate('');
    alert('Oggetto salvato in Inventario!');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Eliminare questo oggetto?')) return;
    const newData = { ...data };
    newData.inventory = newData.inventory.filter(i => i.id !== id);
    updateData(newData);
  };

  const filteredItems = inventory.filter(item => {
    if (tab === 'garanzie' && item.type !== 'Garanzia' && !item.warranty) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">📦 Inventario & Garanzie</div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Torna all'Hub</button>
      </div>

      <div className="bento-grid">
        
        {/* FORM */}
        <div className="bento-card col-span-4">
          <div className="card-header"><div className="card-title">➕ Registra Oggetto</div></div>
          <form onSubmit={handleAdd}>
            <select className="input" value={type} onChange={e => setType(e.target.value)} style={{ borderColor: 'var(--accent-primary)' }}>
              <option value="Archivio">📦 Archivio Generale</option>
              <option value="Garanzia">🛡️ Registro Garanzie</option>
            </select>
            <input type="text" className="input" placeholder="Nome o Barcode *" value={name} onChange={e => setName(e.target.value)} required />
            
            <div className="form-row">
              <select className="input" value={category} onChange={handleCategoryChange} required>
                {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" value={subcategory} onChange={e => setSubcategory(e.target.value)} required>
                {CATEGORIES[category].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="form-row">
              <div>
                <label className="stat-label">Acquisto</label>
                <input type="date" className="input" value={buyDate} onChange={e => setBuyDate(e.target.value)} />
              </div>
              <div>
                <label className="stat-label">Fine Garanzia</label>
                <input type="date" className="input" value={warrantyDate} onChange={e => setWarrantyDate(e.target.value)} />
              </div>
            </div>

            <input type="number" className="input" step="0.01" min="0" placeholder="Valore (€)" value={price} onChange={e => setPrice(e.target.value)} />
            <input type="text" className="input" placeholder="Seriale, modello, note..." value={notes} onChange={e => setNotes(e.target.value)} />
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>💾 Salva Bene</button>
          </form>
        </div>

        {/* LISTA E TAB */}
        <div className="bento-card col-span-8">
          <div className="inner-tabs">
            <button className={`inner-tab ${tab === 'archivio' ? 'active' : ''}`} onClick={() => setTab('archivio')}>📦 Archivio Oggetti</button>
            <button className={`inner-tab ${tab === 'garanzie' ? 'active' : ''}`} onClick={() => setTab('garanzie')}>🛡️ Garanzie</button>
          </div>
          
          <div className="item-list" style={{ maxHeight: '480px' }}>
            {filteredItems.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem' }}>Nessun oggetto trovato.</div>
            ) : (
              filteredItems.map(i => {
                let isExpired = i.warranty && i.warranty < todayStr;
                return (
                  <div key={i.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{i.name}</span>
                        {i.warranty && (
                          <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
                            {isExpired ? 'Scaduta' : 'Fino al ' + i.warranty.split('-').reverse().join('/')}
                          </span>
                        )}
                      </div>
                      <div className="stat-label">{i.category} • {i.subcategory} {i.notes ? `• ${i.notes}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 800 }}>{i.price ? formatCurrency(i.price) : ''}</div>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i.id)}>🗑️</button>
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

export default Inventory;