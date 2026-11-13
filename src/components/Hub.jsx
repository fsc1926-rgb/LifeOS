import React from 'react';

function Hub({ theme, setTheme, toggleTheme, data, updateData, setActiveTab }) {
  
  // Normalizzazione tema corrente
  const activeTheme = (theme === 'dark' || theme === 'oled' || !theme) 
    ? 'oled-black' 
    : (theme === 'light' ? 'light-blue' : theme);

  const handleThemeChange = (newTheme) => {
    if (setTheme) {
      setTheme(newTheme);
    } else if (toggleTheme) {
      toggleTheme();
    }
  };

  const handleReset = () => {
    if (window.confirm('ATTENZIONE: Stai per eliminare tutti i dati. Questa azione è irreversibile. Sei sicuro?')) {
      const emptyData = {
        settings: { theme: 'oled-black', vaultCheck: null, vaultSalt: null },
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
      alert("Haptic Feedback testato con successo sul tuo dispositivo!");
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
        
        {/* GRIGLIA MODULI */}
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

        {/* PERSONALIZZAZIONE TEMA: 3 TEMI AD ALTO CONTRASTO */}
        <div className="bento-card col-span-12">
          <div className="card-header">
            <div className="card-title">🎨 Aspetto & Temi Display</div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Scegli tra i 3 stili grafici con pulsanti e sottocategorie ad alta leggibilità, incluso il tema ottimizzato per il display Dynamic AMOLED 2X del Samsung S25 Ultra:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '0.5rem'
          }}>

            {/* TEMA 1: BIANCO CON BOTTONI BLU */}
            <div
              onClick={() => handleThemeChange('light-blue')}
              style={{
                background: '#ffffff',
                border: activeTheme === 'light-blue' ? '2.5px solid #2563eb' : '1px solid rgba(0,0,0,0.15)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                color: '#0f172a',
                boxShadow: activeTheme === 'light-blue' ? '0 0 20px rgba(37, 99, 235, 0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.85rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>☀️ Bianco & Blu</div>
                  {activeTheme === 'light-blue' && (
                    <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                      ATTIVO
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.3rem' }}>
                  Sfondo bianco puro con pulsanti royal blue e chip azzurri ben distinguibili.
                </div>
              </div>

              {/* ANTEPRIMA BOTTONI & CHIP */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Pulsante Blu
                </span>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Sottobottone
                </span>
              </div>
            </div>

            {/* TEMA 2: BIANCO CON BOTTONI VERDE SCURO */}
            <div
              onClick={() => handleThemeChange('light-green')}
              style={{
                background: '#ffffff',
                border: activeTheme === 'light-green' ? '2.5px solid #15803d' : '1px solid rgba(0,0,0,0.15)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                color: '#0f172a',
                boxShadow: activeTheme === 'light-green' ? '0 0 20px rgba(21, 128, 61, 0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.85rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>🌿 Bianco & Verde Scuro</div>
                  {activeTheme === 'light-green' && (
                    <span style={{ background: '#15803d', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                      ATTIVO
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.3rem' }}>
                  Sfondo bianco puro con pulsanti verde scuro bosco ed elementi di categoria nitidi.
                </div>
              </div>

              {/* ANTEPRIMA BOTTONI & CHIP */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Pulsante Verde
                </span>
                <span style={{ background: '#f0fdf4', color: '#14532d', border: '1px solid #86efac', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Sottobottone
                </span>
              </div>
            </div>

            {/* TEMA 3: NERO CLASSICO OLED S25 ULTRA CON BOTTONI BLU */}
            <div
              onClick={() => handleThemeChange('oled-black')}
              style={{
                background: '#000000',
                border: activeTheme === 'oled-black' ? '2.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.18)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                color: '#ffffff',
                boxShadow: activeTheme === 'oled-black' ? '0 0 25px rgba(59, 130, 246, 0.45)' : '0 2px 8px rgba(0,0,0,0.6)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.85rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>🌌 OLED S25 Ultra (Nero & Blu)</div>
                  {activeTheme === 'oled-black' && (
                    <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                      ATTIVO
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  Nero assoluto #000000 (spegnimento pixel OLED Samsung) con pulsanti blu elettrico e chip tech.
                </div>
              </div>

              {/* ANTEPRIMA BOTTONI & CHIP */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Pulsante Blu
                </span>
                <span style={{ background: '#0e1526', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  Sottobottone
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* IMPOSTAZIONI GENERALI */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">⚙️ Impostazioni Generali</div></div>
          <div className="item-list" style={{ marginTop: '0.5rem' }}>
            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>📳 Vibrazione UI (Haptic Feedback)</div>
              <button className="btn btn-sm btn-secondary-custom" onClick={handleVibrate}>Test Haptic</button>
            </div>
            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>☁️ Sync Database Cloud</div>
              <button className="btn btn-sm btn-primary" onClick={handleSync}>Forza Sync</button>
            </div>
          </div>
        </div>

        {/* ESPORTAZIONE E SICUREZZA */}
        <div className="bento-card col-span-12" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="card-header"><div className="card-title">💾 Esportazioni & Backup</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-sm btn-primary" style={{ width: '100%' }} onClick={handleExportCSV}>📊 Esporta Spese (Excel/CSV)</button>
            <button className="btn btn-sm btn-secondary-custom" style={{ width: '100%' }} onClick={handleExportJSON}>📦 Esporta Backup Dati (JSON)</button>
            <button className="btn btn-sm btn-danger" style={{ width: '100%', marginTop: '1rem' }} onClick={handleReset}>⚠️ Reset Fabbrica (Elimina Tutto)</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Hub;
