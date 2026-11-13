import React from 'react';

function Hub({ theme, onOpenSettings, setActiveTab }) {
  
  const getThemeLabel = (t) => {
    if (t === 'light-blue') return '☀️ Bianco & Blu';
    if (t === 'light-green') return '🌿 Bianco & Verde Scuro';
    return '🌌 OLED S25 Ultra (Nero & Blu)';
  };

  return (
    <div className="module-section active">
      <div className="bento-grid">
        
        {/* GRIGLIA MODULI ECOSISTEMA */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">🎛️ Ecosistema LifeOS</div></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Accedi direttamente ai moduli della tua vita quotidiana:
          </p>
          <div className="hub-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="hub-card" onClick={() => setActiveTab('garage')}>
              <div className="hub-icon">🚗</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Garage</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('maintenance')}>
              <div className="hub-icon">🔧</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Casa</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('inventory')}>
              <div className="hub-icon">📦</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Inventario</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('health')}>
              <div className="hub-icon">❤️</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Salute OS</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('vault')} style={{ border: '1px solid var(--accent-primary)' }}>
              <div className="hub-icon">🔐</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>Deep Vault</div>
            </div>
          </div>
        </div>

        {/* CENTRO IMPOSTAZIONI UNIFICATO (TEMI, BACKUP JSON/CSV, SYNC) */}
        <div className="bento-card col-span-12">
          <div className="card-header">
            <div className="card-title">⚙️ Impostazioni Generali & Sistema</div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Tutte le preferenze di aspetto grafico (3 temi), esportazione/importazione file (JSON e CSV) e sincronizzazione cloud sono raggruppate nel pannello Impostazioni.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                Tema Attivo: <span style={{ color: 'var(--accent-primary)' }}>{getThemeLabel(theme)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Personalizza colori display, esporta report spese o ripristina backup.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenSettings}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem', gap: '0.5rem' }}
            >
              <span>⚙️</span>
              <span>Apri Impostazioni</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Hub;
