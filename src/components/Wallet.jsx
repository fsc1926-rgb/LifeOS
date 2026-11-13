import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

function Wallet({ data, updateData }) {
  if (!data) return <div>Caricamento...</div>;

  // Controlli di sicurezza estremi per evitare crash
  const accounts = data.accounts || [];
  const transactions = data.transactions || [];
  const customCategories = (data.settings && data.settings.walletCategories) ? data.settings.walletCategories : ['Rifornimento', 'Spesa', 'Farmaci', 'Svago', 'Stipendio/Entrate', 'Bollette'];

  // Stati Form Transazione
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Uscita');
  const [category, setCategory] = useState(customCategories[0] || 'Spesa');
  const [desc, setDesc] = useState('');
  const [accId, setAccId] = useState(accounts.length > 0 ? accounts[0].id : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Stati Form Conti
  const [showAccForm, setShowAccForm] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBal, setNewAccBal] = useState('');
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
      id: uid(), accountId: accId, amount: finalVal, type, category, 
      description: desc || category, 
      date 
    });
    updateData(newData);
    setAmount(''); setDesc('');
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAccName) return;
    const newData = { ...data };
    if (!newData.accounts) newData.accounts = [];
    newData.accounts.push({ id: 'acc_' + Date.now(), name: newAccName, balance: parseFloat(newAccBal) || 0 });
    updateData(newData);
    setNewAccName(''); setNewAccBal(''); setShowAccForm(false);
  };

  const deleteTrx = (id, accIdForTrx, trxAmount) => {
    if (!window.confirm("Eliminare questa transazione?")) return;
    const newData = { ...data };
    const aIdx = newData.accounts.findIndex(a => a.id === accIdForTrx);
    if (aIdx > -1) newData.accounts[aIdx].balance -= trxAmount;
    newData.transactions = newData.transactions.filter(t => t.id !== id);
    updateData(newData);
  };

  // Dati PieChart - Protetto dai null
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
      
      {/* CAROSELLO CARTE */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', marginTop: '1rem', scrollbarWidth: 'none' }}>
        <div onClick={() => setSelectedAccFilter(null)} style={{ minWidth: '260px', padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-secondary)', border: selectedAccFilter === null ? '2px solid white' : '2px solid var(--border-color)', flexShrink: 0, cursor: 'pointer' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>PATRIMONIO TOTALE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.5rem 0' }}>{formatCurrency(totalBalance)}</div>
        </div>
        {accounts.map(acc => (
          <div key={acc.id} onClick={() => setSelectedAccFilter(acc.id)} style={{ minWidth: '220px', padding: '1.5rem', borderRadius: '20px', background: 'var(--accent-gradient)', color: 'white', flexShrink: 0, cursor: 'pointer', border: selectedAccFilter === acc.id ? '2px solid white' : '2px solid transparent', opacity: selectedAccFilter !== null && selectedAccFilter !== acc.id ? 0.6 : 1, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{acc.name}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '1.5rem' }}>{formatCurrency(acc.balance)}</div>
          </div>
        ))}
      </div>

      {/* GESTIONE CONTI */}
      <div style={{ marginBottom: '1rem' }}>
        {!showAccForm ? (
          <button className="btn btn-sm" onClick={() => setShowAccForm(true)} style={{ background: 'var(--bg-secondary)' }}>+ Aggiungi Nuovo Conto</button>
        ) : (
          <form onSubmit={handleAddAccount} className="bento-card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '1rem' }}>
            <input type="text" className="input" style={{ flex: '1 1 100px' }} placeholder="Nome Conto" value={newAccName} onChange={e=>setNewAccName(e.target.value)} required />
            <input type="number" className="input" style={{ flex: '1 1 100px' }} step="0.01" placeholder="Saldo Iniziale €" value={newAccBal} onChange={e=>setNewAccBal(e.target.value)} />
            <button type="submit" className="btn btn-primary">Salva</button>
            <button type="button" className="btn" onClick={() => setShowAccForm(false)}>Annulla</button>
          </form>
        )}
      </div>

      <div className="bento-grid" style={{ marginTop: '0.5rem' }}>
        
        {/* FORM REGISTRAZIONE - PORTATO A COL-SPAN-12 */}
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

        {/* LISTA E GRAFICO - PORTATO A COL-SPAN-12 */}
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