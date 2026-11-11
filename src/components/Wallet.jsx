import React, { useState } from 'react';

function Wallet({ data, updateData }) {
  if (!data || !data.accounts) return <div>Caricamento dati...</div>;

  const accounts = data.accounts;
  const transactions = data.transactions || [];
  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

  const [selectedAccount, setSelectedAccount] = useState('ALL');
  
  // Stati per il Form della nuova transazione
  const [txType, setTxType] = useState('EXPENSE');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txAccountId, setTxAccountId] = useState(accounts[0]?.id || '');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  };

  // Funzione per generare un ID univoco
  const uid = () => 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Aggiunge una transazione
  const handleAddTransaction = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return alert('Inserisci un importo valido');

    const newData = { ...data };
    
    // Aggiorna il saldo del conto
    const accountIndex = newData.accounts.findIndex(a => a.id === txAccountId);
    if (accountIndex === -1) return;
    
    if (txType === 'INCOME') {
      newData.accounts[accountIndex].balance += amountNum;
    } else {
      newData.accounts[accountIndex].balance -= amountNum;
    }

    // Aggiunge la transazione in cima alla lista
    const newTx = {
      id: uid(),
      type: txType,
      amount: amountNum,
      accountId: txAccountId,
      desc: txDesc,
      category: txCategory || 'Generale',
      date: txDate
    };
    newData.transactions.unshift(newTx);

    // Salva e resetta il form
    updateData(newData);
    setTxAmount('');
    setTxDesc('');
    setTxCategory('');
  };

  // Elimina e storna una transazione
  const handleDeleteTransaction = (id) => {
    if (!window.confirm('Eliminare il movimento e stornare il saldo?')) return;
    
    const newData = { ...data };
    const txIndex = newData.transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return;
    
    const tx = newData.transactions[txIndex];
    const accountIndex = newData.accounts.findIndex(a => a.id === tx.accountId);
    
    // Storna il saldo
    if (accountIndex !== -1) {
      if (tx.type === 'INCOME') {
        newData.accounts[accountIndex].balance -= tx.amount;
      } else {
        newData.accounts[accountIndex].balance += tx.amount;
      }
    }

    // Rimuovi dalla lista
    newData.transactions.splice(txIndex, 1);
    updateData(newData);
  };

  // Filtra i movimenti in base al conto selezionato
  const filteredTransactions = transactions.filter(t => 
    selectedAccount === 'ALL' || t.accountId === selectedAccount
  );

  return (
    <div className="module-section active">
      <div className="bento-grid">
        <div className="bento-card col-span-12">
          
          <div className="card-header">
            <div>
              <h2 className="card-title">💳 Il Mio Wallet Digitale</h2>
            </div>
            <span className="badge badge-success sensitive" style={{ fontSize: '0.95rem', padding: '0.35rem 0.85rem' }}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
          
          {/* CAROSELLO CONTI */}
          <div className="wallet-carousel">
            <div className={`wallet-card wallet-card-all ${selectedAccount === 'ALL' ? 'selected' : ''}`} onClick={() => setSelectedAccount('ALL')}>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 700 }}>PATRIMONIO TOTALE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: '0.25rem' }}>{formatCurrency(totalBalance)}</div>
            </div>
            {accounts.map((acc, index) => (
              <div key={acc.id} className={`wallet-card wallet-card-${index % 5} ${selectedAccount === acc.id ? 'selected' : ''}`} onClick={() => setSelectedAccount(acc.id)}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{acc.name}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(acc.balance)}</div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

          {/* FORM INSERIMENTO */}
          <div className="card-header"><div className="card-title">💸 Registra Transazione</div></div>
          <form onSubmit={handleAddTransaction} style={{ marginBottom: '1.25rem' }}>
            <div className="form-row">
              <select className="input" value={txType} onChange={e => setTxType(e.target.value)} required>
                <option value="EXPENSE">📉 Uscita / Spesa</option>
                <option value="INCOME">📈 Entrata / Stipendio</option>
              </select>
              <input type="number" className="input" step="0.01" min="0.01" placeholder="Importo € *" value={txAmount} onChange={e => setTxAmount(e.target.value)} required />
            </div>
            <div className="form-row">
              <select className="input" value={txAccountId} onChange={e => setTxAccountId(e.target.value)} required>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <input type="text" className="input" placeholder="Causale *" value={txDesc} onChange={e => setTxDesc(e.target.value)} required />
              <input type="text" className="input" placeholder="Categoria (es. Svago)" value={txCategory} onChange={e => setTxCategory(e.target.value)} />
            </div>
            <div className="form-row">
              <input type="date" className="input" value={txDate} onChange={e => setTxDate(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>💾 Registra nel Libro Mastro</button>
          </form>

          {/* LIBRO MASTRO (LISTA TRANSAZIONI) */}
          <div className="card-header" style={{ marginBottom: '0.6rem' }}>
            <div className="card-title">📜 Libro Mastro <span className="badge">{filteredTransactions.length}</span></div>
          </div>
          
          <div className="item-list">
            {filteredTransactions.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem' }}>Nessun movimento.</div>
            ) : (
              filteredTransactions.map(t => (
                <div key={t.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.desc}</div>
                    <div className="stat-label">{t.date.split('-').reverse().join('/')} • {t.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      fontWeight: 800, 
                      fontFamily: "'JetBrains Mono', monospace", 
                      color: t.type === 'INCOME' ? 'var(--success)' : 'var(--danger)' 
                    }}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTransaction(t.id)}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Wallet;