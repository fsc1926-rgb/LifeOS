import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Preset colori e banche popolari (ING arancione, Revolut viola/tech, Intesa blu, PostePay giallo, ecc.)
export const BANK_COLOR_PRESETS = [
  { id: 'ing', label: 'ING (Arancione)', bg: 'linear-gradient(135deg, #ff6200, #ea580c)', solid: '#ff6200' },
  { id: 'revolut', label: 'Revolut (Tech Blu/Nero)', bg: 'linear-gradient(135deg, #18181b, #0075eb)', solid: '#0075eb' },
  { id: 'intesa', label: 'Intesa / BBVA (Blu Royal)', bg: 'linear-gradient(135deg, #1d4ed8, #2563eb)', solid: '#2563eb' },
  { id: 'postepay', label: 'PostePay (Giallo)', bg: 'linear-gradient(135deg, #ca8a04, #eab308)', solid: '#eab308' },
  { id: 'n26', label: 'N26 (Verde Smeraldo)', bg: 'linear-gradient(135deg, #15803d, #22c55e)', solid: '#15803d' },
  { id: 'unicredit', label: 'UniCredit (Rosso)', bg: 'linear-gradient(135deg, #b91c1c, #ef4444)', solid: '#ef4444' },
  { id: 'black', label: 'Black Card (Nero Opaco)', bg: 'linear-gradient(135deg, #09090b, #27272a)', solid: '#18181b' },
  { id: 'pink', label: 'Rosa / Magenta', bg: 'linear-gradient(135deg, #be185d, #ec4899)', solid: '#ec4899' },
  { id: 'purple', label: 'Viola Nobile', bg: 'linear-gradient(135deg, #4c1d95, #7c3aed)', solid: '#7c3aed' }
];

function Wallet({ data, updateData }) {
  if (!data) return <div>Caricamento...</div>;

  const accounts = data.accounts || [];
  const transactions = data.transactions || [];
  const customCategories = (data.settings && data.settings.walletCategories) 
    ? data.settings.walletCategories 
    : ['Rifornimento', 'Spesa', 'Farmaci', 'Svago', 'Stipendio/Entrate', 'Bollette'];

  // Stati Form Transazione
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Uscita');
  const [category, setCategory] = useState(customCategories[0] || 'Spesa');
  const [desc, setDesc] = useState('');
  const [accId, setAccId] = useState(accounts.length > 0 ? accounts[0].id : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Stati Form Nuovo Conto
  const [showAccForm, setShowAccForm] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBal, setNewAccBal] = useState('');
  const [newAccColor, setNewAccColor] = useState(BANK_COLOR_PRESETS[0].bg);

  // Stato Modifica Colore Conto Esistente
  const [editingColorAccId, setEditingColorAccId] = useState(null);

  const [selectedAccFilter, setSelectedAccFilter] = useState(null);

  const uid = () => 'trx_' + Date.now().toString(36);
  const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      const newCat = window.prompt('Inserisci il nome della nuova categoria:');
      if (newCat && newCat.trim() !== '') {
        const newData = { ...data };
        if (!newData.settings) newData.settings = {};
        newData.settings.walletCategories = [...customCategories, newCat.trim()];
        updateData(newData);
        setCategory(newCat.trim());
      }
    } else {
      setCategory(val);
    }
  };

  const handleAddTrx = (e) => {
    e.preventDefault();
    if (!amount || !accId) return;
    const newData = { ...data };
    const val = parseFloat(amount);
    const finalVal = type === 'Uscita' ? -Math.abs(val) : Math.abs(val);

    if (!newData.accounts) newData.accounts = [];
    const aIdx = newData.accounts.findIndex(a => a.id === accId);
    if (aIdx > -1) newData.accounts[aIdx].balance += finalVal;

    if (!newData.transactions) newData.transactions = [];
    newData.transactions.unshift({ 
      id: uid(), 
      accountId: accId, 
      amount: finalVal, 
      type, 
      category, 
      description: desc || category, 
      date 
    });
    updateData(newData);
    setAmount(''); 
    setDesc('');
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const newData = { ...data };
    if (!newData.accounts) newData.accounts = [];
    newData.accounts.push({ 
      id: 'acc_' + Date.now(), 
      name: newAccName.trim(), 
      balance: parseFloat(newAccBal) || 0,
      color: newAccColor
    });
    updateData(newData);
    setNewAccName(''); 
    setNewAccBal(''); 
    setNewAccColor(BANK_COLOR_PRESETS[0].bg);
    setShowAccForm(false);
  };

  const handleUpdateAccountColor = (targetAccId, chosenColor) => {
    const newData = { ...data };
    const idx = (newData.accounts || []).findIndex(a => a.id === targetAccId);
    if (idx > -1) {
      newData.accounts[idx].color = chosenColor;
      updateData(newData);
    }
    setEditingColorAccId(null);
  };

  const handleDeleteAccount = (targetAccId, accName) => {
    if (accounts.length <= 1) {
      alert("Devi avere almeno un conto nel tuo wallet.");
      return;
    }
    if (!window.confirm(`Sei sicuro di voler eliminare il conto "${accName}"?`)) return;
    const newData = { ...data };
    newData.accounts = newData.accounts.filter(a => a.id !== targetAccId);
    if (selectedAccFilter === targetAccId) setSelectedAccFilter(null);
    updateData(newData);
  };

  const deleteTrx = (id, accIdForTrx, trxAmount) => {
    if (!window.confirm("Eliminare questa transazione?")) return;
    const newData = { ...data };
    const aIdx = newData.accounts.findIndex(a => a.id === accIdForTrx);
    if (aIdx > -1) newData.accounts[aIdx].balance -= trxAmount;
    newData.transactions = newData.transactions.filter(t => t.id !== id);
    updateData(newData);
  };

  // Dati Grafico a Torta
  const expenseData = {};
  transactions.forEach(t => {
    if (t.type === 'Uscita') {
      const cat = t.category || 'Altro';
      expenseData[cat] = (expenseData[cat] || 0) + Math.abs(t.amount);
    }
  });
  const pieData = Object.keys(expenseData).map(key => ({ name: key, value: expenseData[key] })).sort((a, b) => b.value - a.value);
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const displayedTrx = selectedAccFilter ? transactions.filter(t => t.accountId === selectedAccFilter) : transactions;

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '0.5rem' }}>
        <div className="card-title" style={{ fontSize: '1.2rem' }}>💳 Il Mio Wallet Digitale</div>
      </div>
      
      {/* CAROSELLO CARTE BANCARIE CON COLORI PERSONALIZZATI */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', marginTop: '1rem', scrollbarWidth: 'none' }}>
        
        {/* CARD PATRIMONIO TOTALE */}
        <div 
          onClick={() => setSelectedAccFilter(null)} 
          style={{ 
            minWidth: '240px', 
            padding: '1.4rem', 
            borderRadius: '20px', 
            background: 'var(--bg-secondary)', 
            border: selectedAccFilter === null ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', 
            flexShrink: 0, 
            cursor: 'pointer',
            boxShadow: selectedAccFilter === null ? '0 0 16px var(--accent-glow)' : 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>PATRIMONIO TOTALE</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.5rem 0', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(totalBalance)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tutti i conti ({accounts.length})</div>
        </div>

        {/* CARTE DEI SINGOLI CONTI (ING, Revolut, Intesa, ecc.) */}
        {accounts.map(acc => {
          const cardBackground = acc.color || 'var(--accent-gradient)';
          const isSelected = selectedAccFilter === acc.id;

          return (
            <div 
              key={acc.id} 
              onClick={() => setSelectedAccFilter(acc.id)} 
              style={{ 
                minWidth: '240px', 
                padding: '1.4rem', 
                borderRadius: '20px', 
                background: cardBackground, 
                color: 'white', 
                flexShrink: 0, 
                cursor: 'pointer', 
                border: isSelected ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)', 
                opacity: selectedAccFilter !== null && !isSelected ? 0.6 : 1, 
                boxShadow: isSelected ? '0 8px 25px rgba(0,0,0,0.5)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{acc.name}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* Tasto Cambio Colore Carta */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingColorAccId(acc.id); }}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)'
                    }}
                    title="Cambia colore carta"
                  >
                    🎨
                  </button>
                  {/* Tasto Elimina Conto */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id, acc.name); }}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)'
                    }}
                    title="Elimina conto"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '1.25rem', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                {formatCurrency(acc.balance)}
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP SELETTORE COLORE CONTO ESISTENTE */}
      {editingColorAccId && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>🎨 Scegli il colore per il conto</div>
            <button className="btn btn-sm" onClick={() => setEditingColorAccId(null)}>✕ Chiudi</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {BANK_COLOR_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleUpdateAccountColor(editingColorAccId, preset.bg)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  background: preset.bg,
                  color: 'white',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GESTIONE AGGIUNGI NUOVO CONTO (CON SELETTORE COLORI BANCHE) */}
      <div style={{ marginBottom: '1rem' }}>
        {!showAccForm ? (
          <button 
            className="btn btn-sm btn-secondary-custom" 
            onClick={() => setShowAccForm(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>➕</span>
            <span>Aggiungi Nuovo Conto (es. ING, Revolut, Intesa)</span>
          </button>
        ) : (
          <form 
            onSubmit={handleAddAccount} 
            className="bento-card" 
            style={{ padding: '1.25rem', gap: '0.85rem' }}
          >
            <div className="card-title" style={{ fontSize: '0.95rem' }}>➕ Crea Nuovo Conto Bancario o Wallet</div>

            <div className="form-row">
              <input 
                type="text" 
                className="input" 
                placeholder="Nome Conto (es. ING Direct, Revolut, Intesa)" 
                value={newAccName} 
                onChange={e => setNewAccName(e.target.value)} 
                required 
              />
              <input 
                type="number" 
                className="input" 
                step="0.01" 
                placeholder="Saldo Iniziale €" 
                value={newAccBal} 
                onChange={e => setNewAccBal(e.target.value)} 
              />
            </div>

            {/* SELEZIONE COLORE / BRAND BANCARIO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Colore Carta / Banca:
              </label>
              
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                {BANK_COLOR_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setNewAccColor(p.bg)}
                    style={{
                      padding: '0.45rem 0.8rem',
                      borderRadius: '10px',
                      background: p.bg,
                      color: 'white',
                      border: newAccColor === p.bg ? '2.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: newAccColor === p.bg ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                      transition: 'transform 0.1s ease'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* ANTEPRIMA CARTA IN CREAZIONE */}
              <div style={{
                background: newAccColor,
                borderRadius: '14px',
                padding: '0.85rem 1.25rem',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                <span style={{ fontWeight: 800 }}>Anteprima: {newAccName || 'Nome Conto'}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900 }}>
                  {formatCurrency(newAccBal || 0)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                Salva Conto
              </button>
              <button type="button" className="btn" onClick={() => setShowAccForm(false)}>
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bento-grid" style={{ marginTop: '0.5rem' }}>
        
        {/* FORM REGISTRAZIONE TRANSAZIONE */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">💸 Registra Transazione</div></div>
          <form onSubmit={handleAddTrx}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
              <div onClick={() => setType('Uscita')} style={{ flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, background: type === 'Uscita' ? 'var(--danger)' : 'transparent', color: type === 'Uscita' ? 'white' : 'var(--text-muted)' }}>📉 Uscita</div>
              <div onClick={() => setType('Entrata')} style={{ flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, background: type === 'Entrata' ? 'var(--success)' : 'transparent', color: type === 'Entrata' ? 'white' : 'var(--text-muted)' }}>📈 Entrata</div>
            </div>

            <div className="form-row">
              <input type="number" className="input" step="0.01" placeholder="Importo € *" value={amount} onChange={e => setAmount(e.target.value)} required />
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            
            <select className="input" value={accId} onChange={e => setAccId(e.target.value)} required style={{ marginBottom: '0.5rem' }}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
            </select>
            
            <select className="input" value={category} onChange={handleCategoryChange} style={{ marginBottom: '0.5rem' }}>
              {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>➕ Aggiungi Nuova Categoria...</option>
            </select>
            
            <input type="text" className="input" placeholder="Causale (Facoltativa)" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: '1rem' }} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>Registra Movimento</button>
          </form>
        </div>

        {/* LISTA E GRAFICO TRANSAZIONI */}
        <div className="bento-card col-span-12">
          {pieData.length > 0 && selectedAccFilter === null && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
              <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📊 Analisi Spese Totali</div>
              <div style={{ width: '100%', height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-primary)', border: 'none' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card-header"><div className="card-title">📜 Ultimi Movimenti</div></div>
          <div className="item-list" style={{ maxHeight: '400px' }}>
            {displayedTrx.length === 0 ? <div className="stat-label" style={{textAlign:'center', padding:'2rem'}}>Nessun movimento.</div> :
              displayedTrx.map(t => {
                const acc = accounts.find(a => a.id === t.accountId);
                const catStr = t.category || '';
                const descStr = t.description || '';
                const isGarage = catStr.toLowerCase() === 'rifornimento' || descStr.includes('🚗');
                
                return (
                  <div key={t.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isGarage && <span title="Collegato al Garage">⛽</span>}
                        {descStr}
                      </div>
                      <div className="stat-label">{t.date ? t.date.split('-').reverse().join('/') : 'Data assente'} • {catStr} • {acc ? acc.name : 'Conto eliminato'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <strong style={{ color: t.type === 'Entrata' ? 'var(--success)' : 'var(--text-primary)' }}>
                        {t.type === 'Entrata' ? '+' : ''}{formatCurrency(t.amount)}
                      </strong>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteTrx(t.id, t.accountId, t.amount)}>🗑️</button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

      </div>
    </div>
  );
}

export default Wallet;
