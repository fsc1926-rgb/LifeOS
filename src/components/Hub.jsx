import React from 'react';

function Hub({ theme, toggleTheme, data, updateData, setActiveTab }) {
  
  const handleReset = () => {
    if (window.confirm('ATTENZIONE: Stai per eliminare tutti i dati. Questa azione è irreversibile. Sei sicuro?')) {
      const emptyData = {
        settings: { theme: 'dark', vaultCheck: null, vaultSalt: null },
        accounts: [{ id: 'acc_1', name: 'Conto Principale', balance: 0 }],
        transactions: [], tasks: [], garage: [], maintenances: [], inventory: [], weights: [], medical: [], vault: []
      };
      updateData(emptyData);
      alert('Sistema resettato.');
      window.location.reload();
    }
  };

  const handleVibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
      alert("Haptic Feedback testato con successo!");
    } else {
      alert("Il tuo dispositivo o browser non supporta la vibrazione.");
    }
  };

  const handleSync = async () => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const DOC_REF = doc(db, 'lifeos', 'user_data');
      await setDoc(DOC_REF, data, { merge: true });
      localStorage.setItem('LIFEOS_DATA_BACKUP', JSON.stringify(data));
      alert('✅ Sincronizzazione completata con successo!');
    } catch (err) {
      console.warn('Errore sync:', err);
      alert('⚠️ Sincronizzazione fallita. Controlla la connessione.');
    }
  };

  const handleExportJSON = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.href = dataStr; link.download = `LifeOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); link.remove();
  };

  const handleExportCSV = () => {
    if (!data || !data.transactions || data.transactions.length === 0) return alert("Nessuna transazione!");
    let csv = "Data,Categoria,Tipo,Importo,Descrizione\n";
    data.transactions.forEach(t => {
      const desc = (t.description || "").replace(/,/g, " "); 
      csv += `${t.date},${t.category},${t.type},${t.amount},${desc}\n`;
    });
    const link = document.createElement('a');
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `LifeOS_Spese.csv`;
    document.body.appendChild(link); link.click(); link.remove();
  };

  return (
    <div className="module-section active">
      <div className="bento-grid">
        
        {/* LA TUA GRIGLIA MODULI */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">🎛️ Ecosistema LifeOS</div></div>
          <div className="hub-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="hub-card" onClick={() => setActiveTab('garage')}><div className="hub-icon">🚗</div><div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Garage</div></div>
            <div className="hub-card" onClick={() => setActiveTab('maintenance')}><div className="hub-icon">🔧</div><div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Casa</div></div>
            <div className="hub-card" onClick={() => setActiveTab('inventory')}><div className="hub-icon">📦</div><div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Inventario</div></div>
            <div className="hub-card" onClick={() => setActiveTab('health')}><div className="hub-icon">❤️</div><div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Salute OS</div></div>
            <div className="hub-card" onClick={() => setActiveTab('vault')} style={{ border: '1px solid var(--accent-primary)' }}><div className="hub-icon">🔐</div><div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>Deep Vault</div></div>
          </div>
        </div>

        {/* IMPOSTAZIONI GENERALI RIPRISTINATE */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">⚙️ Impostazioni Generali</div></div>
          <div className="item-list" style={{ marginTop: '1rem' }}>
            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>🌓 Tema Applicazione</div>
              <button className="btn btn-sm" onClick={toggleTheme}>{theme === 'dark' ? 'Passa a Chiaro' : 'Passa a Scuro'}</button>
            </div>
            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>📳 Vibrazione UI</div>
              <button className="btn btn-sm" onClick={handleVibrate}>Test Haptic</button>
            </div>
            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>☁️ Sync Database</div>
              <button className="btn btn-sm" onClick={handleSync} style={{ background: 'var(--accent-primary)', color: 'white' }}>Forza Sync</button>
            </div>
          </div>
        </div>

        {/* ESPORTAZIONE E SICUREZZA */}
        <div className="bento-card col-span-12" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="card-header"><div className="card-title">💾 Esportazioni & Backup</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-sm" style={{ width: '100%', background: 'var(--accent-primary)', color: 'white' }} onClick={handleExportCSV}>📊 Esporta Spese (Excel/CSV)</button>
            <button className="btn btn-sm" style={{ width: '100%', border: '1px solid var(--text-muted)' }} onClick={handleExportJSON}>📦 Esporta Backup Dati (JSON)</button>
            <button className="btn btn-sm btn-danger" style={{ width: '100%', marginTop: '1rem' }} onClick={handleReset}>⚠️ Reset Fabbrica (Elimina Tutto)</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Hub;