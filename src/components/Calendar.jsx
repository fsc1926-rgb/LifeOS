import React, { useState } from 'react';

function Calendar({ data, updateData }) {
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento...</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [calDate, setCalDate] = useState(new Date());

  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState('Attività');
  const [taskPriority, setTaskPriority] = useState('Normale');

  const [journalMood, setJournalMood] = useState('😊 Sereno');
  const [journalText, setJournalText] = useState('');

  // Utilità per il calendario
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const monthName = new Date(year, month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const changeMonth = (delta) => {
    const newDate = new Date(calDate);
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + delta);
    setCalDate(newDate);
  };

  const handleDayClick = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    
    // Auto-compila il diario se esiste già una voce per questa data
    const existingJournal = data.journal.find(j => j.date === dateStr);
    setJournalText(existingJournal ? existingJournal.text : '');
    setJournalMood(existingJournal ? existingJournal.mood : '😊 Sereno');
  };

  // Funzioni Dati
  const addTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const newData = { ...data };
    newData.tasks.push({
      id: 'tsk_' + Date.now(),
      date: selectedDateStr,
      title: taskTitle.trim(),
      type: taskType,
      priority: taskPriority,
      done: false
    });
    updateData(newData);
    setTaskTitle('');
  };

  const toggleTask = (id) => {
    const newData = { ...data };
    const t = newData.tasks.find(x => x.id === id);
    if (t) t.done = !t.done;
    updateData(newData);
  };

  const deleteTask = (id) => {
    if(!window.confirm('Eliminare questo task?')) return;
    const newData = { ...data };
    newData.tasks = newData.tasks.filter(x => x.id !== id);
    updateData(newData);
  };

  const saveJournal = (e) => {
    e.preventDefault();
    if (!journalText.trim()) return;
    const newData = { ...data };
    const existing = newData.journal.find(j => j.date === selectedDateStr);
    if (existing) {
      existing.mood = journalMood;
      existing.text = journalText;
    } else {
      newData.journal.push({ id: 'jrn_' + Date.now(), date: selectedDateStr, mood: journalMood, text: journalText });
    }
    updateData(newData);
    alert('Diario salvato!');
  };

  // Dati filtrati per il giorno selezionato
  const dayTasks = data.tasks.filter(t => t.date === selectedDateStr);

  return (
    <div className="module-section active">
      <div className="bento-grid">
        
        {/* WIDGET CALENDARIO */}
        <div className="bento-card col-span-5">
          <div className="card-header">
            <button className="btn btn-sm" onClick={() => changeMonth(-1)}>◀</button>
            <div className="card-title">{monthName}</div>
            <button className="btn btn-sm" onClick={() => changeMonth(1)}>▶</button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="stat-label">
              Giorno: <strong style={{ color: 'var(--accent-primary)' }}>{selectedDateStr.split('-').reverse().join('/')}</strong>
            </span>
            <button className="btn btn-sm" onClick={() => { setCalDate(new Date()); handleDayClick(new Date().getDate()); }}>Oggi</button>
          </div>

          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const hasItems = data.tasks.some(t => t.date === dateStr && !t.done) || data.journal.some(j => j.date === dateStr);
              
              return (
                <div 
                  key={d} 
                  className={`cal-day ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(d)}
                >
                  <span>{d}</span>
                  {hasItems && <div className="cal-dot"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* TASK DEL GIORNO */}
        <div className="bento-card col-span-4">
          <div className="card-header">
            <div className="card-title">✅ Task del Giorno</div>
            <span className="badge">{dayTasks.length}</span>
          </div>
          
          <form onSubmit={addTask} style={{ marginBottom: '1rem' }}>
            <input type="text" className="input" placeholder="Nuova attività..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
            <div className="form-row">
              <select className="input" value={taskType} onChange={e => setTaskType(e.target.value)}>
                <option value="Attività">📌 Attività</option>
                <option value="Promemoria">⏰ Promemoria</option>
                <option value="Evento">🗓️ Evento</option>
              </select>
              <select className="input" value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                <option value="Normale">Priorità Normale</option>
                <option value="Alta">🔥 Alta</option>
                <option value="Bassa">🌱 Bassa</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>+ Aggiungi al Giorno</button>
          </form>

          <div className="item-list" style={{ maxHeight: '320px' }}>
            {dayTasks.length === 0 ? <div className="stat-label" style={{textAlign:'center', padding:'1rem'}}>Nessun task per questa data.</div> : 
              dayTasks.map(t => (
                <div key={t.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }} onClick={() => toggleTask(t.id)}>
                    <span>{t.done ? '✅' : '⬜'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }}>
                        {t.title}
                      </div>
                      <div className="stat-label">{t.type} • Priorità {t.priority}</div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTask(t.id)}>🗑️</button>
                </div>
              ))
            }
          </div>
        </div>

        {/* DIARIO */}
        <div className="bento-card col-span-3">
          <div className="card-header"><div className="card-title">📓 Diario & Mood</div></div>
          <form onSubmit={saveJournal}>
            <select className="input" value={journalMood} onChange={e => setJournalMood(e.target.value)}>
              <option value="🚀 Eccellente">🚀 Eccellente</option>
              <option value="😊 Sereno">😊 Sereno</option>
              <option value="😐 Neutro">😐 Neutro</option>
              <option value="⚡ Stressato">⚡ Stressato</option>
              <option value="🔋 Stanco">🔋 Stanco</option>
            </select>
            <textarea 
              rows="5" 
              className="input" 
              placeholder="Pensieri, gratitudine o note di oggi..." 
              value={journalText} 
              onChange={e => setJournalText(e.target.value)}
            ></textarea>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>💾 Salva nel Diario</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Calendar;