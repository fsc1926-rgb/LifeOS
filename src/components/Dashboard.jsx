import React from 'react';

function Dashboard({ data, updateData }) {
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento...</div>;

  const { accounts = [], habits = [], tasks = [] } = data;
  
  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const hr = new Date().getHours();
  const greeting = hr >= 13 && hr < 18 ? 'Buon pomeriggio ☀️' : hr >= 18 || hr < 5 ? 'Buonasera 🌙' : 'Buongiorno ✨';
  
  const todayStr = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleAddHabit = () => {
    const title = window.prompt('Nome della nuova abitudine quotidiana:');
    if (!title || !title.trim()) return;
    
    const newHabits = [...(data.habits || []), {
      id: 'hab_' + Date.now(),
      title: title.trim(),
      streak: 0,
      lastDone: null
    }];
    updateData({ ...data, habits: newHabits });
  };

  const toggleHabit = (id) => {
    const newHabits = (data.habits || []).map(h => {
      if (h.id !== id) return h;
      return { ...h, lastDone: h.lastDone === todayStr ? null : todayStr };
    });
    updateData({ ...data, habits: newHabits });
  };

  return (
    <div className="module-section active">
      <div className="bento-grid">
        
        {/* HERO CARD (Saluto) */}
        <div className="bento-card hero-card col-span-12">
          <div className="hero-content">
            <div className="hero-greeting">
              <div className="stat-label" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                {formattedDate}
              </div>
              <h1>{greeting}</h1>
              <div className="hero-insight">
                <span>🧠</span>
                <span>Giornata sotto controllo. Ottimo ritmo! 🚀</span>
              </div>
            </div>
            
            {/* Life Score Visivo */}
            <div className="score-ring-box">
              <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                <svg className="score-svg" viewBox="0 0 60 60">
                  <circle className="score-bg" cx="30" cy="30" r="24"></circle>
                  <circle className="score-progress" cx="30" cy="30" r="24" style={{ strokeDashoffset: '45' }}></circle>
                </svg>
                <span style={{ position: 'absolute', fontWeight: 900, fontSize: '0.85rem', fontFamily: "'JetBrains Mono', monospace" }}>
                  100%
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Life Score</div>
                <div className="stat-label" style={{ fontSize: '0.72rem' }}>Indice Giornata</div>
              </div>
            </div>
          </div>
        </div>

        {/* PATRIMONIO LIQUIDO */}
        <div className="bento-card col-span-4">
          <div className="card-header">
            <span className="card-title">💰 Patrimonio Liquido</span>
          </div>
          <div className="stat-value sensitive">{formatCurrency(totalBalance)}</div>
          <div className="stat-label">{accounts.length} {accounts.length === 1 ? 'conto attivo' : 'conti attivi'}</div>
        </div>

        {/* ABITUDINI & STREAK */}
        <div className="bento-card col-span-4">
          <div className="card-header">
            <span className="card-title">🔥 Abitudini & Streak</span>
            <button className="btn btn-sm btn-primary" onClick={handleAddHabit}>+ Nuova</button>
          </div>
          <div className="item-list" style={{ maxHeight: '210px' }}>
            {habits.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1rem' }}>Nessuna abitudine attiva.</div>
            ) : (
              habits.map(h => (
                <div key={h.id} className="list-row" onClick={() => toggleHabit(h.id)} style={{ cursor: 'pointer', minHeight: 'auto', padding: '0.6rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{h.lastDone === todayStr ? '✅' : '⭕'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', textDecoration: h.lastDone === todayStr ? 'line-through' : 'none', opacity: h.lastDone === todayStr ? 0.6 : 1 }}>
                        {h.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PROSSIME ATTIVITA' */}
        <div className="bento-card col-span-4">
          <div className="card-header">
            <span className="card-title">📌 Prossime Attività & Scadenze</span>
          </div>
          <div className="item-list">
            <div className="stat-label" style={{ textAlign: 'center', padding: '1rem' }}>Nessuna scadenza imminente.</div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;