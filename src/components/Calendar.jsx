import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SwipeableRow from './SwipeableRow';

moment.locale('it');
const localizer = momentLocalizer(moment);

const CLIENT_ID = '134105903978-iijbk09d809e80vsjheolfrgka1jqlis.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

function Calendar({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const tasks = data.tasks || [];
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Personale');
  
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleToken, setGoogleToken] = useState(null);

  const uid = () => 'tsk_' + Date.now().toString(36);

  const handleGoogleSync = () => {
    if (!window.google) return alert("Libreria Google in caricamento, attendi qualche secondo o ricarica la pagina.");
    
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setGoogleToken(tokenResponse.access_token);
          setIsGoogleSynced(true);
          fetchGoogleEvents(tokenResponse.access_token);
        }
      },
    });
    tokenClient.requestAccessToken();
  };

  const fetchGoogleEvents = async (token) => {
    try {
      const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (result.items) {
        const formatted = result.items.map(item => ({
          id: item.id,
          title: `🔵 ${item.summary || 'Senza Titolo'}`,
          start: new Date(item.start.dateTime || item.start.date),
          end: new Date(item.end.dateTime || item.end.date),
          allDay: !item.start.dateTime,
          isGoogle: true
        }));
        setGoogleEvents(formatted);
      }
    } catch (err) {
      alert("Errore nel caricamento del calendario Google.");
    }
  };

  const pushToGoogleCalendar = async (taskData) => {
    if (!googleToken) return;
    try {
      const event = {
        summary: `LifeOS: ${taskData.title}`,
        start: { date: taskData.date },
        end: { date: taskData.date },
        description: `Categoria: ${taskData.category}\nAggiunto dal tuo ecosistema LifeOS.`
      };
      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      fetchGoogleEvents(googleToken);
    } catch (e) {
      console.error("Errore salvataggio su Google", e);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title) return;
    const newData = { ...data };
    if (!newData.tasks) newData.tasks = [];
    
    const newTask = { id: uid(), title, date, category, status: 'todo' };
    newData.tasks.unshift(newTask);
    updateData(newData);
    setTitle('');
    
    if (isGoogleSynced) pushToGoogleCalendar(newTask);
  };

  const toggleTaskStatus = (id) => {
    const newData = { ...data };
    const tIndex = newData.tasks.findIndex(t => t.id === id);
    if (tIndex > -1) {
      newData.tasks[tIndex].status = newData.tasks[tIndex].status === 'done' ? 'todo' : 'done';
      updateData(newData);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Eliminare definitivamente questo task locale? (Non eliminerà l'evento su Google se già sincronizzato)")) return;
    const newData = { ...data };
    newData.tasks = newData.tasks.filter(t => t.id !== id);
    updateData(newData);
  };

  const localEvents = tasks.map(t => ({
    id: t.id,
    title: `${t.status === 'done' ? '✅' : '⭕'} ${t.title}`,
    start: new Date(t.date),
    end: new Date(t.date),
    allDay: true,
    resource: t
  }));

  const filteredTasks = tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="module-section active">
      
      {/* 🎨 STILI CSS PER TRASFORMARE IL CALENDARIO IN DARK MODE 🎨 */}
      <style>{`
        .rbc-calendar { color: var(--text-primary); font-family: inherit; }
        .rbc-month-view { border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-primary); overflow: hidden; }
        .rbc-header { padding: 8px 0; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; border-bottom: 1px solid var(--border-color) !important; color: var(--text-muted); }
        .rbc-header + .rbc-header { border-left: 1px solid var(--border-color) !important; }
        .rbc-day-bg { border-left: 1px solid var(--border-color) !important; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--border-color) !important; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid var(--border-color) !important; }
        
        /* Sistema i riquadri bianchi dei mesi precedenti/successivi */
        .rbc-off-range-bg { background-color: var(--bg-secondary) !important; opacity: 0.6; }
        
        /* Colora il giorno di oggi con un tocco di viola */
        .rbc-today { background-color: rgba(139, 92, 246, 0.15) !important; }
        
        /* Stile per i numeri dei giorni */
        .rbc-date-cell { padding: 4px 8px; font-weight: 600; font-size: 0.9rem; }
        .rbc-off-range { color: var(--text-muted); }
        
        /* Sistema i bottoni in alto (Oggi, Indietro, Avanti, Mese, Agenda) */
        .rbc-toolbar button { 
          color: var(--text-primary); 
          background: var(--bg-secondary); 
          border: 1px solid var(--border-color); 
          border-radius: 8px; 
          margin-right: 0.5rem; 
          padding: 0.4rem 0.8rem; 
          cursor: pointer; 
          transition: all 0.2s ease;
          font-weight: 600;
        }
        .rbc-toolbar button:hover { background: rgba(139, 92, 246, 0.2); }
        .rbc-toolbar button.rbc-active { 
          background: var(--accent-primary); 
          color: white; 
          border-color: var(--accent-primary); 
          box-shadow: none;
        }
        .rbc-toolbar .rbc-toolbar-label { font-weight: 800; font-size: 1.2rem; text-transform: capitalize; }
      `}</style>

      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">📅 Agenda & Calendario</div>
        <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Hub</button>
      </div>

      <div className="bento-grid">
        
        <div className="bento-card col-span-12" style={{ background: 'var(--bg-secondary)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="card-title" style={{ fontSize: '1rem' }}>🗓️ Il Tuo Mese</div>
            <button 
              className="btn btn-sm" 
              onClick={handleGoogleSync}
              style={{ 
                background: isGoogleSynced ? 'var(--success)' : 'white', 
                color: isGoogleSynced ? 'white' : '#0f172a', 
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              {isGoogleSynced ? '🔄 Google Calendar Connesso' : '🔗 Sincronizza Google Calendar'}
            </button>
          </div>
          
          <div style={{ height: '450px', background: 'var(--bg-primary)', borderRadius: '12px', padding: '1rem' }}>
            <BigCalendar
              localizer={localizer}
              events={[...localEvents, ...googleEvents]}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'agenda']}
              defaultView="month"
              messages={{ next: "▶", previous: "◀", today: "Oggi", month: "Mese", agenda: "Agenda", noEventsInRange: "Nessun evento in questo periodo." }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.isGoogle ? '#4285F4' : (event.resource?.status === 'done' ? 'var(--success)' : 'var(--accent-primary)'),
                  borderRadius: '6px',
                  opacity: 0.95,
                  color: 'white',
                  border: 'none',
                  fontSize: '0.75rem',
                  padding: '3px 6px',
                  fontWeight: '600'
                }
              })}
            />
          </div>
        </div>

        <div className="bento-card col-span-12">
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input type="text" className="input" style={{ flex: '1 1 100%' }} placeholder="Nuovo Task o Appuntamento..." value={title} onChange={e => setTitle(e.target.value)} required />
            <input type="date" className="input" style={{ flex: 1 }} value={date} onChange={e => setDate(e.target.value)} required />
            <select className="input" style={{ flex: 1 }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Lavoro">Lavoro</option>
              <option value="Personale">Personale</option>
              <option value="Casa">Casa</option>
              <option value="Compleanno">Compleanno</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-primary)', border: 'none', padding: '0 1.5rem', fontSize: '1.2rem' }}>+</button>
          </form>

          <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>DA FARE (SCORRI PER COMPLETARE)</div>
          <div className="item-list" style={{ maxHeight: '40vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {filteredTasks.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1rem' }}>Nessun task in agenda.</div>
            ) : (
              filteredTasks.map(t => (
                <SwipeableRow key={t.id} onDelete={() => toggleTaskStatus(t.id)}>
                  <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, border: 'none', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', width: '100%' }} onClick={() => toggleTaskStatus(t.id)}>
                      <span style={{ fontSize: '1.4rem' }}>{t.status === 'done' ? '✅' : '⭕'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? 0.6 : 1, wordBreak: 'break-word' }}>
                          {t.title}
                        </div>
                        <div className="stat-label" style={{ marginTop: '0.2rem' }}>
                          {t.date.split('-').reverse().join('/')} {t.category ? `• ${t.category}` : ''}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: '10px' }} onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>🗑️</button>
                  </div>
                </SwipeableRow>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;