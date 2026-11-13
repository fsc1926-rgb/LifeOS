import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SwipeableRow from './SwipeableRow';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

moment.locale('it');
const localizer = momentLocalizer(moment);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

function Calendar({ data, updateData, setActiveTab }) {
  if (!data) return <div>Caricamento...</div>;

  const tasks = data.tasks || [];
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Personale');
  
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleToken, setGoogleToken] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const uid = () => 'tsk_' + Date.now().toString(36);

  // Ripristina eventi ed eventuale token salvato in locale al caricamento
  useEffect(() => {
    // 1. Carica eventi Google salvati in cache
    try {
      const cached = localStorage.getItem('lifeos_gcal_events');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const formatted = parsed.map(item => ({
            ...item,
            start: new Date(item.start),
            end: new Date(item.end)
          }));
          setGoogleEvents(formatted);
        }
      }
    } catch (e) {
      console.warn("Impossibile caricare eventi gcal in cache:", e);
    }

    // 2. Carica token di sessione se ancora valido
    const savedToken = sessionStorage.getItem('lifeos_gcal_token') || localStorage.getItem('lifeos_gcal_token');
    if (savedToken) {
      setGoogleToken(savedToken);
      setIsGoogleSynced(true);
      fetchGoogleEvents(savedToken, false);
    }
  }, []);

  // ----------------------------------------------------
  // SINCRONIZZAZIONE GOOGLE CALENDAR (Dual-Engine: Firebase Auth & GSI)
  // ----------------------------------------------------
  const handleGoogleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Connessione a Google Calendar in corso...');

    try {
      // METODO 1: Firebase GoogleAuthProvider con scope Calendar
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        setGoogleToken(accessToken);
        sessionStorage.setItem('lifeos_gcal_token', accessToken);
        localStorage.setItem('lifeos_gcal_token', accessToken);
        setIsGoogleSynced(true);
        await fetchGoogleEvents(accessToken, true);
        return;
      }
      throw new Error("Token OAuth Google non ricevuto da Firebase.");
    } catch (firebaseErr) {
      console.warn("Metodo Firebase non riuscito, provo Google Identity Services:", firebaseErr);

      // METODO 2: Google Identity Services (GSI)
      if (window.google?.accounts?.oauth2 && CLIENT_ID) {
        try {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                const token = tokenResponse.access_token;
                setGoogleToken(token);
                sessionStorage.setItem('lifeos_gcal_token', token);
                localStorage.setItem('lifeos_gcal_token', token);
                setIsGoogleSynced(true);
                await fetchGoogleEvents(token, true);
              } else if (tokenResponse.error) {
                alert(`Errore autorizzazione Google: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              setIsSyncing(false);
            },
            error_callback: (err) => {
              console.error("GSI Error:", err);
              alert("Errore Google Identity: assicurati che i popup non siano bloccati.");
              setIsSyncing(false);
            }
          });
          tokenClient.requestAccessToken();
          return;
        } catch (gsiErr) {
          console.error("Errore GSI:", gsiErr);
        }
      }

      alert(`Connessione Google fallita: ${firebaseErr.message || firebaseErr.code}`);
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = () => {
    if (window.confirm("Disconnettere Google Calendar da LifeOS?")) {
      setGoogleToken(null);
      setIsGoogleSynced(false);
      setGoogleEvents([]);
      sessionStorage.removeItem('lifeos_gcal_token');
      localStorage.removeItem('lifeos_gcal_token');
      localStorage.removeItem('lifeos_gcal_events');
      setSyncStatusMsg('');
    }
  };

  const fetchGoogleEvents = async (token, showAlert = false) => {
    try {
      const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=250`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token scaduto
          sessionStorage.removeItem('lifeos_gcal_token');
          localStorage.removeItem('lifeos_gcal_token');
          setIsGoogleSynced(false);
          setGoogleToken(null);
          if (showAlert) alert("Sessione Google scaduta. Clicca di nuovo per riconnettere.");
          return;
        }
        throw new Error(`Errore API Google (${res.status})`);
      }

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
        localStorage.setItem('lifeos_gcal_events', JSON.stringify(formatted));
        setSyncStatusMsg(`Sincronizzati ${formatted.length} eventi da Google Calendar`);
        if (showAlert) alert(`✅ Sincronizzazione completata! ${formatted.length} eventi importati da Google Calendar.`);
      }
    } catch (err) {
      console.error("Errore fetch Google Calendar:", err);
      if (showAlert) alert("Errore durante il recupero degli eventi da Google Calendar.");
    } finally {
      setIsSyncing(false);
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
      fetchGoogleEvents(googleToken, false);
    } catch (e) {
      console.error("Errore salvataggio su Google", e);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title) return;
    
    const newTask = { id: uid(), title, date, category, status: 'todo' };
    const newTasks = [newTask, ...(data.tasks || [])];
    updateData({ ...data, tasks: newTasks });
    setTitle('');
    
    if (isGoogleSynced) pushToGoogleCalendar(newTask);
  };

  const toggleTaskStatus = (id) => {
    const newTasks = (data.tasks || []).map(t => {
      if (t.id !== id) return t;
      return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
    });
    updateData({ ...data, tasks: newTasks });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Eliminare definitivamente questo task locale? (Non eliminerà l'evento su Google se già sincronizzato)")) return;
    const newTasks = (data.tasks || []).filter(t => t.id !== id);
    updateData({ ...data, tasks: newTasks });
  };

  const localEvents = tasks.map(t => ({
    id: t.id,
    title: `${t.status === 'done' ? '✅' : '⭕'} ${t.title}`,
    start: new Date(t.date),
    end: new Date(t.date),
    allDay: true,
    resource: t
  }));

  const filteredTasks = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="module-section active">
      
      {/* 🎨 STILI CSS PER TRASFORMARE IL CALENDARIO IN DARK / HIGH-CONTRAST MODE 🎨 */}
      <style>{`
        .rbc-calendar { color: var(--text-primary); font-family: inherit; }
        .rbc-month-view { border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-primary); overflow: hidden; }
        .rbc-header { padding: 8px 0; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; border-bottom: 1px solid var(--border-color) !important; color: var(--text-muted); }
        .rbc-header + .rbc-header { border-left: 1px solid var(--border-color) !important; }
        .rbc-day-bg { border-left: 1px solid var(--border-color) !important; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--border-color) !important; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid var(--border-color) !important; }
        
        .rbc-off-range-bg { background-color: var(--bg-secondary) !important; opacity: 0.6; }
        .rbc-today { background-color: var(--category-chip-bg) !important; border: 1px solid var(--border-highlight) !important; }
        
        .rbc-date-cell { padding: 4px 8px; font-weight: 600; font-size: 0.9rem; }
        .rbc-off-range { color: var(--text-muted); }
        
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
        .rbc-toolbar button:hover { background: var(--btn-sub-hover); }
        .rbc-toolbar button.rbc-active { 
          background: var(--accent-gradient); 
          color: white; 
          border-color: transparent; 
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        .rbc-toolbar .rbc-toolbar-label { font-weight: 800; font-size: 1.2rem; text-transform: capitalize; }
      `}</style>

      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">📅 Agenda & Calendario</div>
        <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveTab('hub')}>← Hub</button>
      </div>

      <div className="bento-grid">
        
        <div className="bento-card col-span-12" style={{ background: 'var(--bg-secondary)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div>
              <div className="card-title" style={{ fontSize: '1.05rem' }}>🗓️ Il Tuo Mese</div>
              {syncStatusMsg && (
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginTop: '2px' }}>
                  {syncStatusMsg}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                type="button"
                className="btn btn-sm" 
                onClick={handleGoogleSync}
                disabled={isSyncing}
                style={{ 
                  background: isGoogleSynced ? 'var(--success)' : '#ffffff', 
                  color: isGoogleSynced ? '#ffffff' : '#0f172a', 
                  fontWeight: 700,
                  border: isGoogleSynced ? 'none' : '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>{isSyncing ? '⏳' : isGoogleSynced ? '🔄' : '🔗'}</span>
                <span>
                  {isSyncing 
                    ? 'Connessione...' 
                    : isGoogleSynced 
                    ? 'Google Calendar Sincronizzato' 
                    : 'Sincronizza Google Calendar'}
                </span>
              </button>

              {isGoogleSynced && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleDisconnectGoogle}
                  style={{ padding: '0.4rem 0.6rem' }}
                  title="Disconnetti Google Calendar"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div style={{ height: '480px', background: 'var(--bg-primary)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--border-color)' }}>
            <BigCalendar
              localizer={localizer}
              events={[...localEvents, ...googleEvents]}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'agenda']}
              defaultView="month"
              messages={{ 
                next: "▶", 
                previous: "◀", 
                today: "Oggi", 
                month: "Mese", 
                agenda: "Agenda", 
                noEventsInRange: "Nessun evento in questo periodo." 
              }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.isGoogle ? '#2563eb' : (event.resource?.status === 'done' ? 'var(--success)' : 'var(--accent-primary)'),
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
            <input 
              type="text" 
              className="input" 
              style={{ flex: '1 1 100%' }} 
              placeholder="Nuovo Task o Appuntamento..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <input 
              type="date" 
              className="input" 
              style={{ flex: 1 }} 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
            <select 
              className="input" 
              style={{ flex: 1 }} 
              value={category} 
              onChange={e => setCategory(e.target.value)}
            >
              <option value="Lavoro">Lavoro</option>
              <option value="Personale">Personale</option>
              <option value="Casa">Casa</option>
              <option value="Compleanno">Compleanno</option>
            </select>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '0 1.5rem', fontSize: '1.2rem' }}
            >
              +
            </button>
          </form>

          <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            DA FARE (SCORRI PER COMPLETARE)
          </div>
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
