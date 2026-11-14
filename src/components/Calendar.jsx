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

  // STATI PER VISUALIZZAZIONE A SCHEDA "GOOGLE CALENDAR PRO"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState(null);
  const [agendaFilter, setAgendaFilter] = useState('all'); // 'all' | 'google' | 'tasks'

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

      if (firebaseErr.code === 'auth/unauthorized-domain') {
        const msg = `Dominio non autorizzato (${window.location.hostname}). Aggiungilo in Firebase Console -> Authentication -> Impostazioni -> Domini autorizzati.`;
        setSyncStatusMsg(msg);
        alert(msg);
        setIsSyncing(false);
        return;
      }

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
                const errDetail = tokenResponse.error_description || tokenResponse.error;
                alert(`Errore autorizzazione Google: ${errDetail}\nVerifica che gli URI di reindirizzamento e le origini JavaScript siano autorizzati nella Google Cloud Console.`);
              }
              setIsSyncing(false);
            },
            error_callback: (err) => {
              console.error("GSI Error:", err);
              alert("Errore Google Identity: assicurati che i popup non siano bloccati e che l'origine JavaScript sia configurata su Google Cloud Console.");
              setIsSyncing(false);
            }
          });
          tokenClient.requestAccessToken();
          return;
        } catch (gsiErr) {
          console.error("Errore GSI:", gsiErr);
        }
      }

      const errMsg = `Connessione Google fallita: ${firebaseErr.message || firebaseErr.code}`;
      setSyncStatusMsg(errMsg);
      alert(errMsg);
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

        let detailMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) {
            detailMsg = errData.error.message;
          }
        } catch (_) {}

        if (res.status === 403) {
          throw new Error(`Google Calendar API non abilitata nel progetto (lifeos-fef8d). Dettaglio: ${detailMsg}`);
        }
        throw new Error(`Errore API Google (${detailMsg})`);
      }

      const result = await res.json();
      
      if (result.items && Array.isArray(result.items)) {
        const formatted = result.items
          .filter(item => item && item.status !== 'cancelled' && (item.start?.dateTime || item.start?.date))
          .map(item => {
            const startStr = item.start?.dateTime || item.start?.date;
            const endStr = item.end?.dateTime || item.end?.date || startStr;
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);

            return {
              id: item.id || ('gcal_' + Math.random().toString(36).substring(2, 9)),
              title: item.summary || 'Senza Titolo',
              summary: item.summary || 'Senza Titolo',
              description: item.description || '',
              location: item.location || '',
              htmlLink: item.htmlLink || 'https://calendar.google.com',
              meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null,
              creator: item.creator?.displayName || item.creator?.email || null,
              organizer: item.organizer?.displayName || item.organizer?.email || null,
              attendees: item.attendees || [],
              start: isNaN(startDate.getTime()) ? new Date() : startDate,
              end: isNaN(endDate.getTime()) ? new Date() : endDate,
              allDay: !item.start?.dateTime,
              isGoogle: true
            };
          });

        setGoogleEvents(formatted);
        localStorage.setItem('lifeos_gcal_events', JSON.stringify(formatted));
        setSyncStatusMsg(`Sincronizzati ${formatted.length} eventi da Google Calendar`);
        if (showAlert) alert(`✅ Sincronizzazione completata! ${formatted.length} appuntamenti caricati da Google Calendar.`);
      }
    } catch (err) {
      console.error("Errore fetch Google Calendar:", err);
      const userMessage = err.message || "Errore sconosciuto";
      setSyncStatusMsg(`Errore sincronizzazione: ${userMessage}`);
      if (showAlert) {
        alert(`Impossibile sincronizzare Google Calendar:\n\n${userMessage}`);
      }
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

  // Converti i task locali in formato evento
  const localEvents = tasks.map(t => ({
    id: t.id,
    title: t.title,
    summary: t.title,
    category: t.category,
    status: t.status,
    start: new Date(t.date),
    end: new Date(t.date),
    allDay: true,
    isGoogle: false,
    resource: t
  }));

  // Gestione click su slot/giorno del calendario
  const handleSelectSlot = (slotInfo) => {
    const slotDateStr = moment(slotInfo.start).format('YYYY-MM-DD');
    setDate(slotDateStr); // Precompila il form di inserimento
    
    const dayEvents = [...localEvents, ...googleEvents].filter(ev => {
      const startStr = moment(ev.start).format('YYYY-MM-DD');
      const endStr = moment(ev.end).format('YYYY-MM-DD');
      return slotDateStr >= startStr && slotDateStr <= endStr;
    });

    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      setSelectedDaySchedule({ date: slotInfo.start, events: dayEvents });
    }
  };

  // Unione e ordinamento di tutti gli eventi e task per il feed
  const allEventsCombined = [
    ...googleEvents,
    ...localEvents
  ].sort((a, b) => new Date(a.start) - new Date(b.start));

  const filteredFeed = allEventsCombined.filter(ev => {
    if (agendaFilter === 'google') return ev.isGoogle;
    if (agendaFilter === 'tasks') return !ev.isGoogle;
    return true;
  });

  return (
    <div className="module-section active">
      
      {/* 🎨 STILI CSS PER TRASFORMARE IL CALENDARIO IN DARK / HIGH-CONTRAST MODE 🎨 */}
      <style>{`
        .rbc-calendar { color: var(--text-primary); font-family: inherit; }
        .rbc-month-view { border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-primary); overflow: hidden; }
        .rbc-header { padding: 8px 0; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; border-bottom: 1px solid var(--border-color) !important; color: var(--text-muted); }
        .rbc-header + .rbc-header { border-left: 1px solid var(--border-color) !important; }
        .rbc-day-bg { border-left: 1px solid var(--border-color) !important; cursor: pointer; }
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
        <div className="card-title">📅 Agenda & Calendario Pro</div>
        <button className="btn btn-sm btn-secondary-custom" onClick={() => setActiveTab('hub')}>← Hub</button>
      </div>

      <div className="bento-grid">
        
        {/* ==================================================== */}
        {/* GRIGLIA MENSILE INTERATTIVA                          */}
        {/* ==================================================== */}
        <div className="bento-card col-span-12" style={{ background: 'var(--bg-secondary)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div>
              <div className="card-title" style={{ fontSize: '1.05rem' }}>🗓️ Calendario Appuntamenti</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {syncStatusMsg || (googleEvents.length > 0 ? `🟢 ${googleEvents.length} appuntamenti Google caricati • Tocca per visualizzare la scheda` : "Tocca un evento o una data per aprire la scheda dettagli")}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                type="button"
                className="btn btn-sm" 
                onClick={handleGoogleSync}
                disabled={isSyncing}
                style={{ 
                  background: isGoogleSynced ? '#1a73e8' : '#ffffff', 
                  color: isGoogleSynced ? '#ffffff' : '#0f172a', 
                  fontWeight: 700,
                  border: isGoogleSynced ? 'none' : '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <span>{isSyncing ? '⏳' : isGoogleSynced ? '🔄' : '🔗'}</span>
                <span>
                  {isSyncing 
                    ? 'Connessione...' 
                    : isGoogleSynced 
                    ? 'Sincronizzato con Google' 
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
          
          <div style={{ height: '500px', background: 'var(--bg-primary)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--border-color)' }}>
            <BigCalendar
              localizer={localizer}
              events={[...localEvents, ...googleEvents]}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'agenda']}
              defaultView="month"
              selectable={true}
              onSelectEvent={(event) => setSelectedEvent(event)}
              onSelectSlot={handleSelectSlot}
              messages={{ 
                next: "▶", 
                previous: "◀", 
                today: "Oggi", 
                month: "Mese", 
                agenda: "Agenda", 
                noEventsInRange: "Nessun appuntamento o task in questo periodo." 
              }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.isGoogle ? '#1a73e8' : (event.resource?.status === 'done' ? 'var(--success)' : 'var(--accent-primary)'),
                  borderRadius: '6px',
                  opacity: 0.95,
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.76rem',
                  padding: '3px 6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
                }
              })}
            />
          </div>
        </div>

        {/* ==================================================== */}
        {/* FEED APPUNTAMENTI & TASK (VISTA GOOGLE CALENDAR PRO) */}
        {/* ==================================================== */}
        <div className="bento-card col-span-12">
          
          {/* BARRA FILTRI SCHEDE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="card-title" style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
              📋 Vista Schede Appuntamenti
            </div>
            
            <div style={{
              display: 'flex',
              background: 'var(--btn-sub-bg, #0e1526)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid var(--border-color)',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setAgendaFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: agendaFilter === 'all' ? 'var(--accent-primary)' : 'transparent',
                  color: agendaFilter === 'all' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                Tutti ({allEventsCombined.length})
              </button>

              <button
                type="button"
                onClick={() => setAgendaFilter('google')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: agendaFilter === 'google' ? '#1a73e8' : 'transparent',
                  color: agendaFilter === 'google' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                🔵 Google ({googleEvents.length})
              </button>

              <button
                type="button"
                onClick={() => setAgendaFilter('tasks')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: agendaFilter === 'tasks' ? 'var(--accent-primary)' : 'transparent',
                  color: agendaFilter === 'tasks' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                📋 Task ({tasks.length})
              </button>
            </div>
          </div>

          {/* FORM AGGIUNTA RAPIDA */}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="input" 
              style={{ flex: '1 1 100%' }} 
              placeholder="Aggiungi nuovo task o appuntamento..." 
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
              title="Aggiungi task"
            >
              +
            </button>
          </form>

          {/* LISTA SCHEDE APPUNTAMENTI */}
          <div className="item-list" style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filteredFeed.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                Nessun appuntamento o task trovato in questa visualizzazione.
              </div>
            ) : (
              filteredFeed.map(ev => {
                const isGCal = ev.isGoogle;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: isGCal ? '1px solid rgba(26,115,232,0.35)' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = isGCal ? '#1a73e8' : 'var(--accent-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = isGCal ? 'rgba(26,115,232,0.35)' : 'var(--border-color)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: isGCal ? 'rgba(26,115,232,0.15)' : 'var(--category-chip-bg)',
                        color: isGCal ? '#1a73e8' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.15rem',
                        flexShrink: 0
                      }}>
                        {isGCal ? '🔵' : (ev.resource?.status === 'done' ? '✅' : '📋')}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.94rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: (!isGCal && ev.resource?.status === 'done') ? 'line-through' : 'none',
                          opacity: (!isGCal && ev.resource?.status === 'done') ? 0.6 : 1
                        }}>
                          {ev.summary || ev.title}
                        </div>

                        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span>🗓️ {moment(ev.start).format('DD/MM/YYYY')}</span>
                          <span>⏰ {ev.allDay ? 'Tutto il giorno' : moment(ev.start).format('HH:mm')}</span>
                          {ev.location && <span>📍 {ev.location}</span>}
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '6px',
                            background: isGCal ? 'rgba(26,115,232,0.15)' : 'var(--category-chip-bg)',
                            color: isGCal ? '#1a73e8' : 'var(--accent-primary)',
                            fontWeight: 700
                          }}>
                            {isGCal ? 'Google Calendar' : (ev.category || 'Task')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vedi Scheda ➔</span>
                      {!isGCal && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          style={{ padding: '0.3rem 0.55rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ev.id);
                          }}
                          title="Elimina"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ==================================================== */}
      {/* 🚀 MODALE SCHEDA EVENTO PRO (GOOGLE CALENDAR PRO)    */}
      {/* ==================================================== */}
      {selectedEvent && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedEvent(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #0d121c)',
              border: selectedEvent.isGoogle ? '1px solid rgba(26, 115, 232, 0.4)' : '1px solid var(--border-color)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem'
            }}
          >
            {/* INTESTAZIONE SCHEDA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: selectedEvent.isGoogle ? '#1a73e8' : 'var(--accent-primary)',
                  color: '#ffffff',
                  boxShadow: selectedEvent.isGoogle ? '0 2px 10px rgba(26,115,232,0.45)' : '0 2px 10px var(--accent-glow)'
                }}>
                  {selectedEvent.isGoogle ? '🔵 Google Calendar' : `📋 LifeOS • ${selectedEvent.category || 'Task'}`}
                </span>
                {selectedEvent.isGoogle && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sincronizzato</span>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* TITOLO EVENTO */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {selectedEvent.summary || selectedEvent.title}
              </h2>
            </div>

            {/* DATA & ORA COMPLETI */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>🗓️</span>
                <span>{moment(selectedEvent.start).format('dddd D MMMM YYYY')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <span>⏰</span>
                <span>
                  {selectedEvent.allDay 
                    ? 'Tutto il giorno' 
                    : `${moment(selectedEvent.start).format('HH:mm')} – ${moment(selectedEvent.end).format('HH:mm')}`}
                </span>
              </div>
            </div>

            {/* TASTO GOOGLE MEET SE PRESENTE */}
            {selectedEvent.meetLink && (
              <a
                href={selectedEvent.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '14px',
                  background: '#1a73e8',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(26,115,232,0.35)'
                }}
              >
                <span>📹</span>
                <span>Partecipa con Google Meet</span>
              </a>
            )}

            {/* LUOGO SE PRESENTE */}
            {selectedEvent.location && (
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>📍</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Luogo</div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontSize: '0.88rem', wordBreak: 'break-word' }}
                  >
                    {selectedEvent.location}
                  </a>
                </div>
              </div>
            )}

            {/* DESCRIZIONE E NOTE */}
            {selectedEvent.description && (
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Note & Descrizione
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.5, maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedEvent.description}
                </div>
              </div>
            )}

            {/* PARTECIPANTI / ORGANIZZATORE */}
            {(selectedEvent.organizer || (selectedEvent.attendees && selectedEvent.attendees.length > 0)) && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0 0.25rem' }}>
                {selectedEvent.organizer && (
                  <div><strong>Organizzatore:</strong> {selectedEvent.organizer}</div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div style={{ marginTop: '0.3rem' }}>
                    <strong>Partecipanti ({selectedEvent.attendees.length}):</strong>{' '}
                    {selectedEvent.attendees.map(a => a.displayName || a.email).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* AZIONI SCHEDA */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {selectedEvent.isGoogle ? (
                <a
                  href={selectedEvent.htmlLink || 'https://calendar.google.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem',
                    background: '#1a73e8',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  <span>🔗</span>
                  <span>Apri su Google Calendar</span>
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.8rem' }}
                    onClick={() => {
                      toggleTaskStatus(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                  >
                    {selectedEvent.resource?.status === 'done' ? '⭕ Segna come da fare' : '✅ Segna completato'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.8rem 1rem' }}
                    onClick={() => {
                      handleDelete(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                    title="Elimina task"
                  >
                    🗑️
                  </button>
                </>
              )}
              
              <button
                type="button"
                className="btn btn-secondary-custom"
                onClick={() => setSelectedEvent(null)}
                style={{ padding: '0.8rem 1.25rem' }}
              >
                Chiudi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 🗓️ MODALE SCHEDA DEL GIORNO (TUTTI GLI EVENTI)        */}
      {/* ==================================================== */}
      {selectedDaySchedule && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedDaySchedule(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #0d121c)',
              border: '1px solid var(--border-color)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  🗓️ Agenda del Giorno
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {moment(selectedDaySchedule.date).format('dddd D MMMM YYYY')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDaySchedule(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {selectedDaySchedule.events.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedDaySchedule(null);
                    setSelectedEvent(ev);
                  }}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: ev.isGoogle ? '1px solid rgba(26,115,232,0.35)' : '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {ev.isGoogle ? '🔵 ' : '📋 '}
                      {ev.summary || ev.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      ⏰ {ev.allDay ? 'Tutto il giorno' : `${moment(ev.start).format('HH:mm')} – ${moment(ev.end).format('HH:mm')}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Apri ➔</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary-custom"
              onClick={() => setSelectedDaySchedule(null)}
              style={{ marginTop: '0.5rem', padding: '0.75rem' }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Calendar;
