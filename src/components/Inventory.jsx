import React, { useState } from 'react';
import SwipeableRow from './SwipeableRow';

const CATEGORIES_MAP = {
  'Elettronica': ['Smartphone & Tablet', 'PC & Accessori', 'Audio & TV', 'Fotografia', 'Domotica', 'Altro Elettronica'],
  'Casa & Arredo': ['Elettrodomestici', 'Mobili', 'Cucina', 'Illuminazione', 'Fai da te', 'Altro Casa'],
  'Abbigliamento & Moda': ['Giacche & Cappotti', 'Scarpe', 'Accessori & Orologi', 'Sportivo', 'Altro'],
  'Documenti & Valori': ['Contratti', 'Certificati', 'Gioielli', 'Collezionismo', 'Altro'],
  'Hobby & Sport': ['Bici & Outdoor', 'Attrezzatura', 'Musica', 'Gaming', 'Altro'],
  'Altro': ['Generico', 'Varie']
};

function Inventory({ data, updateData, setActiveTab }) {
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento...</div>;

  const inventory = Array.isArray(data.inventory) ? data.inventory : [];

  // Tab di comparto: 'all' (Tutti), 'interventi' (Beni & Interventi), 'garanzie' (Solo Garanzie)
  const [activeCompartment, setActiveCompartment] = useState('all');

  // Filtro Categoria e Ricerca
  const [filterCat, setFilterCat] = useState('ALL');
  const [search, setSearch] = useState('');

  // Form State
  const [itemType, setItemType] = useState('Bene'); // 'Bene', 'Intervento', 'Garanzia'
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elettronica');
  const [subcategory, setSubcategory] = useState(CATEGORIES_MAP['Elettronica'][0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasWarranty, setHasWarranty] = useState(true);
  const [warrantyDate, setWarrantyDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(24);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const uid = () => 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  // Aggiorna data di scadenza garanzia quando cambiano data acquisto o mesi
  const handleMonthsChange = (months) => {
    setWarrantyMonths(months);
    if (date && months > 0) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + parseInt(months));
      setWarrantyDate(d.toISOString().split('T')[0]);
    }
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    const subs = CATEGORIES_MAP[cat] || ['Generico'];
    setSubcategory(subs[0]);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Calcola la data di scadenza della garanzia se non inserita manualmente
    let finalWarranty = warrantyDate;
    if (hasWarranty && !finalWarranty && date && warrantyMonths > 0) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + parseInt(warrantyMonths));
      finalWarranty = d.toISOString().split('T')[0];
    }

    const newItem = {
      id: uid(),
      type: itemType, // 'Bene', 'Intervento', 'Garanzia'
      name: name.trim(),
      category,
      subcategory,
      date,
      hasWarranty: hasWarranty || itemType === 'Garanzia',
      warrantyDate: (hasWarranty || itemType === 'Garanzia') ? finalWarranty : '',
      warrantyMonths: parseInt(warrantyMonths) || 0,
      price: parseFloat(price) || 0,
      notes: notes.trim()
    };

    const newInventory = [newItem, ...inventory];
    updateData({ ...data, inventory: newInventory });

    // Reset Form
    setName('');
    setPrice('');
    setNotes('');
    setWarrantyDate('');
    alert('Elemento registrato nell\'Inventario!');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Eliminare definitivamente questo elemento dall\'Inventario?')) return;
    const newInventory = inventory.filter(i => i.id !== id);
    updateData({ ...data, inventory: newInventory });
  };

  // Calcolo dettagliato stato garanzia
  const getWarrantyInfo = (item) => {
    const targetDateStr = item.warrantyDate || (item.warranty ? item.warranty : null);
    if (!targetDateStr) {
      if (!item.hasWarranty && item.type !== 'Garanzia') {
        return { hasWarranty: false, label: 'Nessuna garanzia', color: 'var(--text-muted)', bg: 'transparent' };
      }
      return { hasWarranty: false, label: 'Garanzia non specificata', color: 'var(--text-muted)', bg: 'transparent' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(targetDateStr);
    expDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    const formattedExp = targetDateStr.split('-').reverse().join('/');

    if (diffDays < 0) {
      return {
        hasWarranty: true,
        status: 'expired',
        days: diffDays,
        label: `Scaduta il ${formattedExp} (${Math.abs(diffDays)} gg fa)`,
        badgeClass: 'badge-danger',
        icon: '❌'
      };
    }
    if (diffDays <= 30) {
      return {
        hasWarranty: true,
        status: 'warning',
        days: diffDays,
        label: `In scadenza tra ${diffDays} gg (${formattedExp})`,
        badgeClass: 'badge-warning',
        icon: '⚠️'
      };
    }
    return {
      hasWarranty: true,
      status: 'active',
      days: diffDays,
      label: `Attiva fino al ${formattedExp} (${diffDays} gg rimasti)`,
      badgeClass: 'badge-success',
      icon: '🛡️'
    };
  };

  // Filtraggio per Comparto, Categoria e Barra di Ricerca
  const filteredItems = inventory.filter(item => {
    const wInfo = getWarrantyInfo(item);
    const isIntervento = item.type === 'Intervento' || (item.category && item.category.toLowerCase().includes('manutenzion'));
    const isGaranzia = item.type === 'Garanzia' || wInfo.hasWarranty;

    // 1. Filtro Comparto
    if (activeCompartment === 'interventi') {
      // Comparto Beni & Interventi (esclude elementi catalogati solo come garanzie pure)
      if (item.type === 'Garanzia') return false;
    } else if (activeCompartment === 'garanzie') {
      // Comparto Garanzie: mostra solo elementi che possiedono una garanzia o sono di tipo Garanzia
      if (!wInfo.hasWarranty && item.type !== 'Garanzia') return false;
    }

    // 2. Filtro Categoria
    if (filterCat !== 'ALL' && item.category !== filterCat) return false;

    // 3. Filtro Ricerca
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      const matchSub = (item.subcategory || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchType = (item.type || '').toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchSub && !matchNotes && !matchType) return false;
    }

    return true;
  });

  // Conteggi per i badge sui tab
  const totalCount = inventory.length;
  const countInterventi = inventory.filter(i => i.type !== 'Garanzia').length;
  const countGaranzie = inventory.filter(i => {
    const w = getWarrantyInfo(i);
    return w.hasWarranty || i.type === 'Garanzia';
  }).length;

  return (
    <div className="module-section active">
      {/* HEADER SEZIONE */}
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="card-title" style={{ fontSize: '1.25rem' }}>📦 Inventario, Beni & Garanzie</div>
          <div className="stat-label">Gestisci i tuoi beni, storico interventi e scadenze garanzie</div>
        </div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Torna all'Hub</button>
      </div>

      <div className="bento-grid">
        
        {/* COL-SPAN-4: FORM REGISTRAZIONE BENE / INTERVENTO / GARANZIA */}
        <div className="bento-card col-span-4" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <div className="card-title">➕ Registra Elemento</div>
          </div>

          <form onSubmit={handleAdd}>
            {/* TIPO DI REGISTRAZIONE */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="stat-label" style={{ marginBottom: '0.35rem', fontWeight: 600 }}>Tipologia</div>
              <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setItemType('Bene'); setHasWarranty(true); }}
                  style={{
                    flex: 1, padding: '0.45rem 0.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 700,
                    background: itemType === 'Bene' ? 'var(--accent-gradient)' : 'transparent',
                    color: itemType === 'Bene' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  📦 Bene
                </button>
                <button
                  type="button"
                  onClick={() => { setItemType('Intervento'); setHasWarranty(false); }}
                  style={{
                    flex: 1, padding: '0.45rem 0.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 700,
                    background: itemType === 'Intervento' ? 'var(--accent-gradient)' : 'transparent',
                    color: itemType === 'Intervento' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  🔧 Intervento
                </button>
                <button
                  type="button"
                  onClick={() => { setItemType('Garanzia'); setHasWarranty(true); }}
                  style={{
                    flex: 1, padding: '0.45rem 0.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 700,
                    background: itemType === 'Garanzia' ? 'var(--accent-gradient)' : 'transparent',
                    color: itemType === 'Garanzia' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  🛡️ Garanzia
                </button>
              </div>
            </div>

            {/* NOME */}
            <input
              type="text"
              className="input"
              placeholder={itemType === 'Intervento' ? "Titolo Intervento (es. Sostituzione batteria)... *" : "Nome Bene o Oggetto... *"}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />

            {/* CATEGORIA E SOTTOCATEGORIA */}
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <div className="stat-label" style={{ marginBottom: '0.2rem' }}>Categoria</div>
                <select className="input" value={category} onChange={e => handleCategoryChange(e.target.value)}>
                  {Object.keys(CATEGORIES_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="stat-label" style={{ marginBottom: '0.2rem' }}>Sottocategoria</div>
                <select className="input" value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                  {(CATEGORIES_MAP[category] || ['Generico']).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* DATA */}
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <div className="stat-label" style={{ marginBottom: '0.2rem' }}>
                  {itemType === 'Intervento' ? 'Data Intervento' : 'Data Acquisto'}
                </div>
                <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <div className="stat-label" style={{ marginBottom: '0.2rem' }}>Costo / Valore €</div>
                <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>

            {/* SEZIONE GARANZIA */}
            {(itemType === 'Bene' || itemType === 'Garanzia') && (
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>🛡️ Copertura Garanzia</span>
                  <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasWarranty} onChange={e => setHasWarranty(e.target.checked)} />
                    Attiva
                  </label>
                </div>

                {hasWarranty && (
                  <>
                    <div className="form-row" style={{ marginBottom: '0.4rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="stat-label" style={{ fontSize: '0.72rem' }}>Durata Mesi</div>
                        <select className="input" value={warrantyMonths} onChange={e => handleMonthsChange(e.target.value)}>
                          <option value="12">12 mesi (1 anno)</option>
                          <option value="24">24 mesi (2 anni)</option>
                          <option value="36">36 mesi (3 anni)</option>
                          <option value="48">48 mesi (4 anni)</option>
                          <option value="60">60 mesi (5 anni)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="stat-label" style={{ fontSize: '0.72rem' }}>Scadenza Esatta</div>
                        <input type="date" className="input" value={warrantyDate} onChange={e => setWarrantyDate(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* NOTE O SERIALE */}
            <input type="text" className="input" placeholder="Note, seriale, fornitore o modello..." value={notes} onChange={e => setNotes(e.target.value)} />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
              💾 Salva in Inventario
            </button>
          </form>
        </div>

        {/* COL-SPAN-8: COMPARTI, FILTRI E LISTA BENI / GARANZIE */}
        <div className="bento-card col-span-8" style={{ minWidth: 0 }}>
          
          {/* COMPARTO TABS (INTERVENTI / GARANZIE / TUTTI) */}
          <div className="inner-tabs" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className={`inner-tab ${activeCompartment === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCompartment('all')}
            >
              📋 Tutti i Beni ({totalCount})
            </button>
            <button
              type="button"
              className={`inner-tab ${activeCompartment === 'interventi' ? 'active' : ''}`}
              onClick={() => setActiveCompartment('interventi')}
            >
              🔧 Interventi & Oggetti ({countInterventi})
            </button>
            <button
              type="button"
              className={`inner-tab ${activeCompartment === 'garanzie' ? 'active' : ''}`}
              onClick={() => setActiveCompartment('garanzie')}
            >
              🛡️ Garanzie ({countGaranzie})
            </button>
          </div>

          {/* BARRA FILTRI: CATEGORIA + RICERCA TESTUALE */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select
              className="input"
              style={{ width: 'auto', minWidth: '160px', margin: 0, flexShrink: 0 }}
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
            >
              <option value="ALL">📁 Tutte le Categorie</option>
              {Object.keys(CATEGORIES_MAP).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <input
                type="text"
                className="input"
                style={{ margin: 0, width: '100%', paddingRight: search ? '2rem' : '1rem' }}
                placeholder="🔍 Cerca per nome, seriale, categoria o note..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: '8px', background: 'transparent',
                    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem'
                  }}
                  title="Cancella ricerca"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* LISTA DEI BENI / INTERVENTI / GARANZIE */}
          <div className="item-list" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {filteredItems.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                Nessun elemento trovato per il filtro selezionato.
              </div>
            ) : (
              filteredItems.map(item => {
                const wInfo = getWarrantyInfo(item);
                const isIntervento = item.type === 'Intervento';

                return (
                  <SwipeableRow key={item.id} onDelete={() => handleDelete(item.id)}>
                    <div
                      className="list-row"
                      style={{
                        margin: 0,
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem 1rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>
                            {isIntervento ? '🔧' : item.type === 'Garanzia' ? '🛡️' : '📦'}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.name}</span>
                          
                          {/* BADGE TIPO */}
                          {isIntervento && (
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>Intervento</span>
                          )}

                          {/* BADGE STATO GARANZIA */}
                          {wInfo.hasWarranty && (
                            <span className={`badge ${wInfo.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                              {wInfo.icon} {wInfo.label}
                            </span>
                          )}
                        </div>

                        {/* DETTAGLI CATEGORIA, DATA E NOTE */}
                        <div className="stat-label" style={{ fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
                          <span>{item.category}</span>
                          {item.subcategory && <span> • {item.subcategory}</span>}
                          {item.date && <span> • {item.date.split('-').reverse().join('/')}</span>}
                          {item.notes && <span style={{ color: 'var(--text-primary)', opacity: 0.85 }}> • {item.notes}</span>}
                        </div>
                      </div>

                      {/* PREZZO E PULSANTE ELIMINA */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        {item.price > 0 && (
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isIntervento ? 'var(--danger)' : 'var(--text-primary)' }}>
                            {formatCurrency(item.price)}
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                          title="Elimina"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </SwipeableRow>
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
