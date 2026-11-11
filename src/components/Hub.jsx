import React, { useState } from 'react';

function Hub({ theme, toggleTheme, data, updateData, setActiveTab }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleToggleHaptic = () => {
    if (!data) return;
    const newData = { ...data };
    if (!newData.settings) newData.settings = {};
    newData.settings.haptic = !newData.settings.haptic;
    updateData(newData);
    if (newData.settings.haptic && navigator.vibrate) navigator.vibrate(15);
  };

  const handleReset = () => {
    if (window.confirm('ATTENZIONE: Vuoi resettare i dati di questo dispositivo?')) {
      alert("Il reset profondo verrà attivato nella build finale.");
    }
  };

  return (
    <div className="module-section active">
      <div className="bento-grid">
        <div className="bento-card col-span-12" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">⚡ Hub Ecosistemi</h2>
          </div>
          <div className="stat-label" style={{ marginBottom: '1rem' }}>Sottomoduli specializzati:</div>
          
          <div className="hub-grid">
            <div className="hub-card" onClick={() => setActiveTab('garage')}>
              <div className="hub-icon">🏎️</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Garage OS</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('inventory')}>
              <div className="hub-icon">📦</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Inventario</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('maintenance')}>
              <div className="hub-icon">🔧</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Manutenzioni Casa</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('gallery')}>
              <div className="hub-icon">🖼️</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Media Gallery</div>
            </div>
            <div className="hub-card" onClick={() => setActiveTab('vault')}>
              <div className="hub-icon">🔐</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Deep Vault</div>
            </div>
            <div className="hub-card" onClick={() => setIsSettingsOpen(true)}>
              <div className="hub-icon">⚙️</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Generali</div>
            </div>
            <div className="hub-card" onClick={toggleTheme}>
              <div className="hub-icon">{theme === 'dark' ? '🌙' : '☀️'}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                Tema: {theme === 'dark' ? 'Scuro' : 'Chiaro'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="modal-backdrop open" style={{ display: 'grid' }}>
          <div className="modal-content">
            <div className="card-header">
              <div className="card-title">⚙️ Impostazioni Ecosistema</div>
              <button className="btn btn-sm" onClick={() => setIsSettingsOpen(false)}>✕</button>
            </div>
            <div className="bento-grid">
              <div className="bento-card col-span-12" style={{ padding: '1.1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--info)' }}>
                <div className="card-title" style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--info)' }}>☁️ Cloud Sync (Firebase)</div>
                <div className="stat-label">Stato: 🟢 Connesso e Sincronizzato</div>
              </div>
              <div className="bento-card col-span-12" style={{ padding: '1.1rem' }}>
                <div className="card-title" style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>🎨 Estetica & Feedback</div>
                <button className="btn btn-sm" style={{ width: '100%' }} onClick={handleToggleHaptic}>
                  📳 Vibrazione Aptica: {data?.settings?.haptic ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="bento-card col-span-12" style={{ padding: '1.1rem' }}>
                <div className="card-title" style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>💾 Dati & Sicurezza</div>
                <button className="btn btn-sm btn-danger" style={{ width: '100%' }} onClick={handleReset}>
                  ⚠️ Reset Totale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hub;