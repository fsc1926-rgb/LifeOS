import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Health({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  // Dati persistenti
  const weights = data.weights || [];
  const medical = data.medical || [];
  const medications = data.medications || [];
  const healthSettings = data.healthSettings || { userHeight: 175, weightTarget: 70 };
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHydration = (data.hydration && data.hydration.date === todayStr) ? data.hydration.ml : 0;

  // Sottomodulo attivo: null (Hub Salute OS) | 'medical' | 'weight' | 'medications' | 'hydration'
  const [activeSubModule, setActiveSubModule] = useState(null);

  // Stati Form Peso
  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] = useState(todayStr);

  // Stati Form Cartella Clinica
  const [medTitle, setMedTitle] = useState('');
  const [medDate, setMedDate] = useState(todayStr);
  const [medType, setMedType] = useState('Visita Specialistica');
  const [medDoctor, setMedDoctor] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [medicalFilter, setMedicalFilter] = useState('Tutti');

  // Stati Form Farmaci
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('Mattina (Dopo Colazione)');
  const [medInstructions, setMedInstructions] = useState('');

  // Stato Altezza per Calcolo BMI
  const [heightInput, setHeightInput] = useState(healthSettings.userHeight || 175);
  const [showBmiSettings, setShowBmiSettings] = useState(false);

  const uid = (prefix) => prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ----------------------------------------------------
  // GESTIONE PESO & BMI
  // ----------------------------------------------------
  const handleAddWeight = (e) => {
    e.preventDefault();
    if (!weight) return;
    const newData = { ...data };
    if (!newData.weights) newData.weights = [];
    newData.weights.unshift({ id: uid('wt'), date: weightDate, weight: parseFloat(weight) });
    updateData(newData);
    setWeight('');
    alert('✅ Peso registrato con successo!');
  };

  const handleSaveHeight = (e) => {
    e.preventDefault();
    const newData = { ...data };
    if (!newData.healthSettings) newData.healthSettings = {};
    newData.healthSettings.userHeight = parseFloat(heightInput) || 175;
    updateData(newData);
    setShowBmiSettings(false);
    alert('Altezza aggiornata!');
  };

  const lastWeight = weights.length > 0 ? weights[0].weight : null;
  const userHeightM = (healthSettings.userHeight || 175) / 100;
  const currentBMI = (lastWeight && userHeightM > 0) ? (lastWeight / (userHeightM * userHeightM)).toFixed(1) : null;

  const getBmiCategory = (bmi) => {
    if (!bmi) return { label: 'Non calcolato', color: 'var(--text-muted)' };
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Sottopeso', color: '#38bdf8' };
    if (val < 25) return { label: 'Normopeso', color: 'var(--success)' };
    if (val < 30) return { label: 'Sovrappeso', color: 'var(--warning)' };
    return { label: 'Obesità', color: 'var(--danger)' };
  };

  const bmiCat = getBmiCategory(currentBMI);

  // Dati per il grafico peso
  const chartData = [...weights].reverse().map(w => ({
    data: w.date.split('-').reverse().slice(0, 2).join('/'),
    peso: w.weight
  }));

  // ----------------------------------------------------
  // GESTIONE CARTELLA CLINICA
  // ----------------------------------------------------
  const handleAddMedical = (e) => {
    e.preventDefault();
    if (!medTitle) return;
    const newData = { ...data };
    if (!newData.medical) newData.medical = [];
    newData.medical.unshift({ 
      id: uid('med'), 
      date: medDate, 
      title: medTitle, 
      type: medType, 
      doctor: medDoctor || '', 
      notes: medNotes || '' 
    });
    updateData(newData);
    setMedTitle('');
    setMedDoctor('');
    setMedNotes('');
    alert('✅ Referto aggiunto alla Cartella Clinica!');
  };

  const filteredMedical = medicalFilter === 'Tutti' 
    ? medical 
    : medical.filter(m => m.type === medicalFilter);

  // ----------------------------------------------------
  // GESTIONE FARMACI & TERAPIE
  // ----------------------------------------------------
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!medName) return;
    const newData = { ...data };
    if (!newData.medications) newData.medications = [];
    newData.medications.unshift({
      id: uid('pharm'),
      name: medName,
      dosage: medDosage || '1 dose',
      time: medTime,
      instructions: medInstructions || '',
      lastTaken: null
    });
    updateData(newData);
    setMedName('');
    setMedDosage('');
    setMedInstructions('');
    alert('✅ Farmaco aggiunto alla terapia!');
  };

  const toggleMedicationTaken = (id) => {
    const newData = { ...data };
    const list = [...(newData.medications || [])];
    const idx = list.findIndex(m => m.id === id);
    if (idx > -1) {
      const isTakenToday = list[idx].lastTaken === todayStr;
      list[idx].lastTaken = isTakenToday ? null : todayStr;
      newData.medications = list;
      updateData(newData);
    }
  };

  // ----------------------------------------------------
  // GESTIONE IDRATAZIONE
  // ----------------------------------------------------
  const updateHydration = (amountMl) => {
    const newData = { ...data };
    const current = (newData.hydration && newData.hydration.date === todayStr) ? newData.hydration.ml : 0;
    const nextVal = Math.max(0, current + amountMl);
    newData.hydration = { date: todayStr, ml: nextVal };
    updateData(newData);
  };

  // Eliminazione generica
  const deleteRecord = (key, id) => {
    if (!window.confirm('Eliminare definitivamente questo record?')) return;
    const newData = { ...data };
    newData[key] = (newData[key] || []).filter(item => item.id !== id);
    updateData(newData);
  };

  // =========================================================================
  // VISTA 1: SOTTOMODULO CARTELLA CLINICA
  // =========================================================================
  if (activeSubModule === 'medical') {
    return (
      <div className="module-section active">
        <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              ❤️ Salute OS / Sottomodulo
            </div>
            <div className="card-title" style={{ fontSize: '1.25rem', marginTop: '2px' }}>
              🏥 Cartella Clinica & Esami
            </div>
          </div>
          <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveSubModule(null)}>
            ← Torna a Salute OS
          </button>
        </div>

        <div className="bento-grid">
          {/* FORM NUOVO REFERTO / VISITA */}
          <div className="bento-card col-span-12" style={{ background: 'var(--bg-card)' }}>
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '1rem' }}>➕ Inserisci Nuova Visita o Referto</div>
            </div>
            <form onSubmit={handleAddMedical}>
              <div className="form-row">
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Nome Esame o Visita (es. Controllo Cardiologico, Analisi Sangue) *" 
                  value={medTitle} 
                  onChange={e => setMedTitle(e.target.value)} 
                  required 
                />
                <input 
                  type="date" 
                  className="input" 
                  value={medDate} 
                  onChange={e => setMedDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-row">
                <select className="input" value={medType} onChange={e => setMedType(e.target.value)}>
                  <option value="Visita Specialistica">🩺 Visita Specialistica</option>
                  <option value="Esami del Sangue">🩸 Esami del Sangue</option>
                  <option value="Ecografia/Radiografia">🩻 Ecografia / Radiografia</option>
                  <option value="Controllo Odontoiatrico">🦷 Odontoiatria</option>
                  <option value="Controllo Oculistico">👁️ Oculistica</option>
                  <option value="Vaccino">💉 Vaccino</option>
                  <option value="Intervento">🏥 Intervento Chirurgico</option>
                  <option value="Certificato Medico">📜 Certificato Medico</option>
                </select>

                <input 
                  type="text" 
                  className="input" 
                  placeholder="Medico / Specialista o Struttura Ospedaliera" 
                  value={medDoctor} 
                  onChange={e => setMedDoctor(e.target.value)} 
                />
              </div>

              <textarea 
                className="input" 
                rows="3" 
                placeholder="Esito, note cliniche, valori rilevati, prescrizioni o terapia consigliata..." 
                value={medNotes} 
                onChange={e => setMedNotes(e.target.value)} 
                style={{ resize: 'vertical' }}
              />

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}>
                💾 Salva nella Cartella Clinica
              </button>
            </form>
          </div>

          {/* STORICO REFERTI CLINICI */}
          <div className="bento-card col-span-12">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="card-title" style={{ fontSize: '1rem' }}>
                📋 Storico Documenti Medici ({filteredMedical.length})
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['Tutti', 'Visita Specialistica', 'Esami del Sangue', 'Ecografia/Radiografia'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMedicalFilter(f)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: medicalFilter === f ? 'var(--accent-primary)' : 'var(--btn-sub-bg, #0e1526)',
                      color: medicalFilter === f ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="item-list" style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredMedical.length === 0 ? (
                <div className="stat-label" style={{ textAlign: 'center', padding: '2rem' }}>
                  Nessun referto clinico registrato in questa categoria.
                </div>
              ) : (
                filteredMedical.map(m => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            background: 'var(--category-chip-bg)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.74rem',
                            fontWeight: 800
                          }}>
                            {m.type}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            🗓️ {m.date.split('-').reverse().join('/')}
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                          {m.title}
                        </div>

                        {m.doctor && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            🩺 <strong>Specialista/Struttura:</strong> {m.doctor}
                          </div>
                        )}

                        {m.notes && (
                          <div style={{
                            marginTop: '0.6rem',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-line',
                            lineHeight: 1.45
                          }}>
                            {m.notes}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        style={{ padding: '0.35rem 0.65rem' }}
                        onClick={() => deleteRecord('medical', m.id)}
                        title="Elimina referto"
                      >
                        🗑️
                      </button>
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

  // =========================================================================
  // VISTA 2: SOTTOMODULO PESO & COMPOSIZIONE CORPOREA
  // =========================================================================
  if (activeSubModule === 'weight') {
    return (
      <div className="module-section active">
        <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              ❤️ Salute OS / Sottomodulo
            </div>
            <div className="card-title" style={{ fontSize: '1.25rem', marginTop: '2px' }}>
              ⚖️ Peso & Composizione Corporea
            </div>
          </div>
          <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveSubModule(null)}>
            ← Torna a Salute OS
          </button>
        </div>

        <div className="bento-grid">
          {/* CARD METRICHE RAPIDE & BMI */}
          <div className="bento-card col-span-12" style={{ background: 'var(--bg-card)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ultimo Peso Rilevato</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {lastWeight ? `${lastWeight} kg` : '-- kg'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {weights[0] ? `Rilevato il ${weights[0].date.split('-').reverse().join('/')}` : 'Nessuna pesata registrata'}
              </div>
            </div>

            <div style={{ padding: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Indice di Massa Corporea (BMI)</span>
                <button 
                  type="button" 
                  onClick={() => setShowBmiSettings(!showBmiSettings)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ⚙️ Altezza ({healthSettings.userHeight || 175}cm)
                </button>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: bmiCat.color, marginTop: '0.2rem' }}>
                {currentBMI || '--'}
              </div>
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: 'var(--bg-secondary)',
                border: `1px solid ${bmiCat.color}`,
                color: bmiCat.color,
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {bmiCat.label}
              </span>
            </div>
          </div>

          {/* FORM AGGIORNAMENTO ALTEZZA SE APERTO */}
          {showBmiSettings && (
            <div className="bento-card col-span-12" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)' }}>
              <form onSubmit={handleSaveHeight} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>La tua altezza in cm:</label>
                <input 
                  type="number" 
                  className="input" 
                  value={heightInput} 
                  onChange={e => setHeightInput(e.target.value)} 
                  style={{ width: '100px', margin: 0 }} 
                  required 
                />
                <button type="submit" className="btn btn-primary btn-sm">Salva Altezza</button>
                <button type="button" className="btn btn-sm" onClick={() => setShowBmiSettings(false)}>Annulla</button>
              </form>
            </div>
          )}

          {/* FORM INSERIMENTO NUOVO PESO */}
          <div className="bento-card col-span-12">
            <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>⚖️ Registra Nuova Pesata</div>
            <form onSubmit={handleAddWeight}>
              <div className="form-row">
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="Peso attuale (kg) es. 72.5" 
                  value={weight} 
                  onChange={e => setWeight(e.target.value)} 
                  required 
                />
                <input 
                  type="date" 
                  className="input" 
                  value={weightDate} 
                  onChange={e => setWeightDate(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem', fontWeight: 700 }}>
                + Salva Pesata
              </button>
            </form>
          </div>

          {/* GRAFICO ANDAMENTO */}
          {chartData.length > 1 && (
            <div className="bento-card col-span-12">
              <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>📈 Trend del Peso nel Tempo</div>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="data" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }} />
                    <Line type="monotone" dataKey="peso" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 5, fill: 'var(--accent-primary)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CRONOLOGIA PESATE */}
          <div className="bento-card col-span-12">
            <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>📜 Storico Pesate ({weights.length})</div>
            <div className="item-list" style={{ maxHeight: '35vh', overflowY: 'auto' }}>
              {weights.length === 0 ? (
                <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem' }}>Nessuna pesata registrata.</div>
              ) : (
                weights.map((w, idx) => {
                  const nextW = weights[idx + 1];
                  const diff = nextW ? (w.weight - nextW.weight).toFixed(1) : null;
                  return (
                    <div key={w.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>⚖️</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: "'JetBrains Mono', monospace" }}>
                            {w.weight} kg
                            {diff && (
                              <span style={{
                                fontSize: '0.75rem',
                                marginLeft: '0.5rem',
                                color: parseFloat(diff) > 0 ? 'var(--warning)' : 'var(--success)'
                              }}>
                                {parseFloat(diff) > 0 ? `(+${diff} kg)` : `(${diff} kg)`}
                              </span>
                            )}
                          </div>
                          <div className="stat-label">🗓️ {w.date.split('-').reverse().join('/')}</div>
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRecord('weights', w.id)}>🗑️</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 3: SOTTOMODULO FARMACIA & TERAPIE
  // =========================================================================
  if (activeSubModule === 'medications') {
    return (
      <div className="module-section active">
        <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              ❤️ Salute OS / Sottomodulo
            </div>
            <div className="card-title" style={{ fontSize: '1.25rem', marginTop: '2px' }}>
              💊 Farmacia, Terapie & Integratori
            </div>
          </div>
          <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveSubModule(null)}>
            ← Torna a Salute OS
          </button>
        </div>

        <div className="bento-grid">
          {/* FORM AGGIUNTA FARMACO */}
          <div className="bento-card col-span-12">
            <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>➕ Aggiungi Farmaco o Integratore in Terapia</div>
            <form onSubmit={handleAddMedication}>
              <div className="form-row">
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Nome Farmaco o Integratore (es. Cardioaspirina, Vitamina D) *" 
                  value={medName} 
                  onChange={e => setMedName(e.target.value)} 
                  required 
                />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Dosaggio (es. 100mg, 1 bustina)" 
                  value={medDosage} 
                  onChange={e => setMedDosage(e.target.value)} 
                />
              </div>

              <div className="form-row">
                <select className="input" value={medTime} onChange={e => setMedTime(e.target.value)}>
                  <option value="Mattina (Dopo Colazione)">🌅 Mattina (Dopo Colazione)</option>
                  <option value="Pranzo (A stomaco pieno)">☀️ Pranzo (A stomaco pieno)</option>
                  <option value="Sera / Prima di Dormire">🌙 Sera / Prima di Dormire</option>
                  <option value="Al Bisogno">⚡ Al Bisogno (S.O.S.)</option>
                </select>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Istruzioni o prescrizioni aggiuntive..." 
                  value={medInstructions} 
                  onChange={e => setMedInstructions(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem', fontWeight: 700 }}>
                + Salva Farmaco
              </button>
            </form>
          </div>

          {/* LISTA FARMACI ATTIVI */}
          <div className="bento-card col-span-12">
            <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              💊 Terapie Attive ({medications.length}) • Spunta se assunto oggi
            </div>

            <div className="item-list" style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {medications.length === 0 ? (
                <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  Nessun farmaco o integratore in terapia.
                </div>
              ) : (
                medications.map(m => {
                  const takenToday = m.lastTaken === todayStr;
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: takenToday ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                        border: takenToday ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => toggleMedicationTaken(m.id)}
                          style={{
                            background: takenToday ? 'var(--success)' : 'transparent',
                            border: takenToday ? 'none' : '2px solid var(--border-color)',
                            color: takenToday ? 'white' : 'transparent',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          ✓
                        </button>

                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {m.name} {m.dosage ? `(${m.dosage})` : ''}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            ⏰ {m.time} {m.instructions ? `• ${m.instructions}` : ''}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: takenToday ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>
                            {takenToday ? '✅ Assunto per oggi' : '⭕ Non ancora assunto oggi'}
                          </div>
                        </div>
                      </div>

                      <button className="btn btn-sm btn-danger" onClick={() => deleteRecord('medications', m.id)}>🗑️</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 4: SOTTOMODULO NUTRIZIONE & IDRATAZIONE
  // =========================================================================
  if (activeSubModule === 'hydration') {
    return (
      <div className="module-section active">
        <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              ❤️ Salute OS / Sottomodulo
            </div>
            <div className="card-title" style={{ fontSize: '1.25rem', marginTop: '2px' }}>
              💧 Idratazione & Nutrizione
            </div>
          </div>
          <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveSubModule(null)}>
            ← Torna a Salute OS
          </button>
        </div>

        <div className="bento-grid">
          {/* CONTATORE ACQUA INTERATTIVO */}
          <div className="bento-card col-span-12" style={{ background: 'var(--bg-card)', textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              OBIETTIVO IDRATAZIONE QUOTIDIANA (2.0L)
            </div>

            <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', margin: '0.75rem 0' }}>
              {(todayHydration / 1000).toFixed(2)} L
            </div>

            <div style={{ width: '100%', maxWidth: '360px', height: '14px', background: 'var(--bg-secondary)', borderRadius: '999px', margin: '0 auto 1.5rem auto', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{
                width: `${Math.min(100, (todayHydration / 2000) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                borderRadius: '999px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => updateHydration(250)}
                style={{ padding: '0.75rem 1.25rem', fontWeight: 700, background: '#0284c7', border: 'none' }}
              >
                💧 +1 Bicchiere (250 ml)
              </button>

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => updateHydration(500)}
                style={{ padding: '0.75rem 1.25rem', fontWeight: 700, background: '#0369a1', border: 'none' }}
              >
                🍶 +1 Bottiglietta (500 ml)
              </button>

              <button 
                type="button" 
                className="btn btn-secondary-custom"
                onClick={() => updateHydration(-250)}
                style={{ padding: '0.75rem 1rem' }}
                title="Rimuovi 250ml"
              >
                -250 ml
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA PRINCIPALE: HUB MODULARE SALUTE OS ("STILE DATA BOY")
  // =========================================================================
  return (
    <div className="module-section active">
      {/* HEADER PRINCIPALE SALUTE OS */}
      <div className="card-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="card-title" style={{ fontSize: '1.4rem' }}>❤️ Salute OS</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Cartella Clinica, Peso Corporeo, Terapie & Idratazione
          </div>
        </div>
        <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveTab('hub')}>
          ← Torna all'Hub
        </button>
      </div>

      {/* KPI OVERVIEW CARDS RAPIDE IN TESTA */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.9rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Peso Attuale</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {lastWeight ? `${lastWeight} kg` : '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: bmiCat.color, fontWeight: 700 }}>
            {currentBMI ? `BMI ${currentBMI} (${bmiCat.label})` : 'Calcola BMI'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.9rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Cartella Clinica</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {medical.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Documenti salvati
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.9rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Terapie Attive</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {medications.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Farmaci / Integratori
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.9rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Acqua Oggi</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', marginTop: '0.2rem' }}>
            {(todayHydration / 1000).toFixed(1)} L
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Obiettivo 2.0 L
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODULI DI ACCESSO "STILE DATA BOY"                   */}
      {/* Grandi tasti interattivi per accedere a ogni modulo  */}
      {/* ==================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        
        {/* MODULO 1: CARTELLA CLINICA & ESAMI */}
        <div
          onClick={() => setActiveSubModule('medical')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.4rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🏥
              </span>
              <span style={{
                background: 'var(--btn-sub-bg, #0e1526)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)'
              }}>
                {medical.length} referti
              </span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Cartella Clinica & Esami
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Storico visite specialistiche, referti, analisi del sangue, radiografie, vaccini e note del medico.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--accent-primary)'
          }}>
            <span>Entra nella Cartella Clinica</span>
            <span>➔</span>
          </div>
        </div>

        {/* MODULO 2: PESO & COMPOSIZIONE CORPOREA */}
        <div
          onClick={() => setActiveSubModule('weight')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.4rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ⚖️
              </span>
              <span style={{
                background: 'var(--btn-sub-bg, #0e1526)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)'
              }}>
                {lastWeight ? `${lastWeight} kg` : 'Nessun dato'}
              </span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Peso & Composizione Corporea
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Tracciamento del peso, calcolo automatico del BMI in base all'altezza e trend grafico nel tempo.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--accent-primary)'
          }}>
            <span>Entra in Peso & BMI</span>
            <span>➔</span>
          </div>
        </div>

        {/* MODULO 3: FARMACIA & TERAPIE */}
        <div
          onClick={() => setActiveSubModule('medications')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.4rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#a855f7',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                💊
              </span>
              <span style={{
                background: 'var(--btn-sub-bg, #0e1526)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)'
              }}>
                {medications.length} farmaci
              </span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Farmacia & Terapie
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Pillole e integratori giornalieri, orari di assunzione, dosaggio e registro delle dosi assunte oggi.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--accent-primary)'
          }}>
            <span>Entra in Farmacia & Terapie</span>
            <span>➔</span>
          </div>
        </div>

        {/* MODULO 4: IDRATAZIONE & NUTRIZIONE */}
        <div
          onClick={() => setActiveSubModule('hydration')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.4rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0ea5e9',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                💧
              </span>
              <span style={{
                background: 'var(--btn-sub-bg, #0e1526)',
                color: '#0ea5e9',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)'
              }}>
                {(todayHydration / 1000).toFixed(1)} / 2.0 L
              </span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Idratazione & Acqua
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Contatore bicchieri d'acqua e liquidi assunti con indicatore di progresso verso i 2 litri giornalieri.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--accent-primary)'
          }}>
            <span>Entra in Idratazione</span>
            <span>➔</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Health;
