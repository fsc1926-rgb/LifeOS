import React, { useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function SettingsModal({ isOpen, onClose, theme, setTheme, data, updateData }) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const activeTheme = (theme === 'dark' || theme === 'oled' || !theme) 
    ? 'oled-black' 
    : (theme === 'light' ? 'light-blue' : theme);

  // ----------------------------------------------------
  // GESTIONE ESPORTAZIONE & IMPORTAZIONE
  // ----------------------------------------------------
  const handleExportCSV = () => {
    if (!data || !data.transactions || data.transactions.length === 0) {
      alert("Nessuna transazione registrata da esportare.");
      return;
    }
    let csv = "Data,Categoria,Tipo,Importo,Descrizione\n";
    data.transactions.forEach(t => {
      const desc = (t.description || "").replace(/,/g, " "); 
      csv += `${t.date},${t.category},${t.type},${t.amount},${desc}\n`;
    });
    const link = document.createElement('a');
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `LifeOS_Spese_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportJSON = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `LifeOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportJSONClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error("Formato del file non valido.");
        }
        if (window.confirm("Sei sicuro di voler importare questo file di backup? I dati attuali verranno aggiornati.")) {
          updateData(parsed);
          alert("✅ Dati importati e ripristinati con successo!");
          onClose();
        }
      } catch (err) {
        alert("⚠️ Errore durante l'importazione: file JSON non valido o corrotto.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset per consentire ricaricamento
  };

  // ----------------------------------------------------
  // GESTIONE SISTEMA
  // ----------------------------------------------------
  const handleSyncCloud = async () => {
    try {
      const DOC_REF = doc(db, 'lifeos', 'user_data');
      await setDoc(DOC_REF, data, { merge: true });
      localStorage.setItem('LIFEOS_DATA_BACKUP', JSON.stringify(data));
      alert('✅ Sincronizzazione Cloud completata con successo!');
    } catch (err) {
      console.warn('Errore sync:', err);
      alert('⚠️ Sincronizzazione fallita. Controlla la connessione.');
    }
  };

  const handleVibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
      alert("📳 Haptic Feedback testato con successo sul tuo dispositivo!");
    } else {
      alert("Il tuo dispositivo o browser non supporta la vibrazione.");
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

  return (
    <div
      className="modal-backdrop open"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100000,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #0d121c)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* HEADER MODALE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
            <span>⚙️</span>
            <span>Impostazioni LifeOS</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* ==================================================== */}
        {/* SEZIONE 1: TEMI DISPLAY AD ALTO CONTRASTO             */}
        {/* ==================================================== */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🎨</span>
            <span>Tema Display & Colori</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            Seleziona il tema grafico per pulsanti e categorie, incluso il profilo OLED per Galaxy S25:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            
            {/* TEMA 1: BIANCO E BLU */}
            <div
              onClick={() => setTheme('light-blue')}
              style={{
                background: '#ffffff',
                border: activeTheme === 'light-blue' ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.15)',
                borderRadius: '14px',
                padding: '0.85rem',
                cursor: 'pointer',
                color: '#0f172a',
                boxShadow: activeTheme === 'light-blue' ? '0 0 16px rgba(37, 99, 235, 0.35)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>☀️ Bianco & Blu</span>
                {activeTheme === 'light-blue' && (
                  <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px' }}>✓</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#2563eb' }} />
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe' }} />
              </div>
            </div>

            {/* TEMA 2: BIANCO E VERDE SCURO */}
            <div
              onClick={() => setTheme('light-green')}
              style={{
                background: '#ffffff',
                border: activeTheme === 'light-green' ? '2px solid #15803d' : '1px solid rgba(0,0,0,0.15)',
                borderRadius: '14px',
                padding: '0.85rem',
                cursor: 'pointer',
                color: '#0f172a',
                boxShadow: activeTheme === 'light-green' ? '0 0 16px rgba(21, 128, 61, 0.35)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>🌿 Verde Bosco</span>
                {activeTheme === 'light-green' && (
                  <span style={{ background: '#15803d', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px' }}>✓</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#15803d' }} />
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #86efac' }} />
              </div>
            </div>

            {/* TEMA 3: OLED S25 ULTRA */}
            <div
              onClick={() => setTheme('oled-black')}
              style={{
                background: '#000000',
                border: activeTheme === 'oled-black' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '14px',
                padding: '0.85rem',
                cursor: 'pointer',
                color: '#ffffff',
                boxShadow: activeTheme === 'oled-black' ? '0 0 16px rgba(59, 130, 246, 0.45)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>🌌 OLED S25</span>
                {activeTheme === 'oled-black' && (
                  <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px' }}>✓</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0e1526', border: '1px solid #3b82f6' }} />
              </div>
            </div>

          </div>
        </div>

        {/* ==================================================== */}
        {/* SEZIONE 2: IMPORTAZIONE ED ESPORTAZIONE FILE          */}
        {/* ==================================================== */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>💾</span>
            <span>Gestione File & Backup (JSON / CSV)</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            Esporta o ripristina i dati completi dell'ecosistema LifeOS:
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary-custom"
                onClick={handleExportCSV}
                style={{ padding: '0.65rem', justifyContent: 'center' }}
              >
                📊 Esporta CSV (Excel)
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary-custom"
                onClick={handleExportJSON}
                style={{ padding: '0.65rem', justifyContent: 'center' }}
              >
                📦 Esporta JSON
              </button>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleImportJSONClick}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              📥 Importa Backup JSON
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SEZIONE 3: SINCRONIZZAZIONE E DISPOSITIVO             */}
        {/* ==================================================== */}
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚡</span>
            <span>Sistema & Sincronizzazione</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>☁️ Database Cloud (Firebase)</span>
              <button className="btn btn-sm btn-primary" onClick={handleSyncCloud}>Sincronizza Ora</button>
            </div>

            <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>📳 Vibrazione UI (Haptic Feedback)</span>
              <button className="btn btn-sm btn-secondary-custom" onClick={handleVibrate}>Test</button>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleReset}
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem' }}
            >
              ⚠️ Reset Completo di Fabbrica
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsModal;
