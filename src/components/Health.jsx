import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Health({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const weights = data.weights || [];
  const medical = data.medical || [];

  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);

  const [medTitle, setMedTitle] = useState('');
  const [medDate, setMedDate] = useState(new Date().toISOString().split('T')[0]);
  const [medType, setMedType] = useState('Visita Specialistica');
  const [medNotes, setMedNotes] = useState('');

  const uid = () => 'hlt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const handleAddWeight = (e) => {
    e.preventDefault();
    if (!weight) return;
    const newData = { ...data };
    if (!newData.weights) newData.weights = [];
    newData.weights.unshift({ id: uid(), date: weightDate, weight: parseFloat(weight) });
    updateData(newData);
    setWeight('');
    alert('Peso registrato!');
  };

  const handleAddMedical = (e) => {
    e.preventDefault();
    if (!medTitle) return;
    const newData = { ...data };
    if (!newData.medical) newData.medical = [];
    newData.medical.unshift({ id: uid(), date: medDate, title: medTitle, type: medType, notes: medNotes });
    updateData(newData);
    setMedTitle('');
    setMedNotes('');
    alert('Referto registrato!');
  };

  const deleteItem = (type, id) => {
    if (!window.confirm('Eliminare questo record?')) return;
    const newData = { ...data };
    newData[type] = newData[type].filter(item => item.id !== id);
    updateData(newData);
  };

  // Ordina i pesi per il grafico
  const chartData = [...weights].reverse().map(w => ({
    data: w.date.split('-').reverse().slice(0, 2).join('/'),
    peso: w.weight
  }));

  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">❤️ Salute OS</div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Torna all'Hub</button>
      </div>

      <div className="bento-grid">
        
        {/* PESO E MISURAZIONI - ORA COL-SPAN-12 PER PRENDERE TUTTA LA LARGHEZZA */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">⚖️ Tracciamento Peso</div></div>
          <form onSubmit={handleAddWeight} style={{ marginBottom: '1rem' }}>
            <div className="form-row">
              <input type="number" step="0.1" className="input" placeholder="Peso (kg)" value={weight} onChange={e => setWeight(e.target.value)} required />
              <input type="date" className="input" value={weightDate} onChange={e => setWeightDate(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>+ Registra Peso</button>
          </form>
          
          {chartData.length > 1 && (
            <div style={{ height: '150px', width: '100%', marginBottom: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="data" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="peso" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-primary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="item-list" style={{ maxHeight: '250px' }}>
            {weights.length === 0 ? <div className="stat-label" style={{textAlign:'center', padding:'1rem'}}>Nessun dato.</div> :
              weights.map(w => (
                <div key={w.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{w.weight} kg</strong>
                    <div className="stat-label">{w.date.split('-').reverse().join('/')}</div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteItem('weights', w.id)}>🗑️</button>
                </div>
              ))
            }
          </div>
        </div>

        {/* CARTELLA CLINICA - ORA COL-SPAN-12 PER NON ESSERE PIU SCHIACCIATA */}
        <div className="bento-card col-span-12">
          <div className="card-header"><div className="card-title">🏥 Cartella Clinica & Esami</div></div>
          <form onSubmit={handleAddMedical} style={{ marginBottom: '1rem' }}>
            <div className="form-row">
              <input type="text" className="input" placeholder="Visita o Esame *" value={medTitle} onChange={e => setMedTitle(e.target.value)} required />
              <input type="date" className="input" value={medDate} onChange={e => setMedDate(e.target.value)} required />
            </div>
            <div className="form-row">
              <select className="input" value={medType} onChange={e => setMedType(e.target.value)}>
                <option value="Visita Specialistica">Visita Specialistica</option>
                <option value="Esami del Sangue">Esami del Sangue</option>
                <option value="Ecografia/Radiografia">Ecografia/Radiografia</option>
                <option value="Intervento">Intervento</option>
                <option value="Vaccino">Vaccino</option>
              </select>
              <input type="text" className="input" placeholder="Note, medico o esito..." value={medNotes} onChange={e => setMedNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>+ Aggiungi a Storico Medico</button>
          </form>

          <div className="item-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {medical.length === 0 ? <div className="stat-label" style={{textAlign:'center', padding:'1rem'}}>Nessun referto.</div> :
              medical.map(m => (
                <div 
                  key={m.id} 
                  className="list-row" 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    gap: '1rem', 
                    height: 'auto',
                    minHeight: 'min-content',
                    padding: '0.75rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 700, 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word', 
                      overflow: 'visible',
                      display: 'block' 
                    }}>
                      {m.title}
                    </div>
                    <div className="stat-label" style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word', 
                      overflow: 'visible', 
                      display: 'block', 
                      marginTop: '0.4rem', 
                      lineHeight: '1.4' 
                    }}>
                      {m.date.split('-').reverse().join('/')} • {m.type} {m.notes ? `\nNote: ${m.notes}` : ''}
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-sm btn-danger" 
                    style={{ flexShrink: 0, marginTop: '2px' }} 
                    onClick={() => deleteItem('medical', m.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  );
}

export default Health;