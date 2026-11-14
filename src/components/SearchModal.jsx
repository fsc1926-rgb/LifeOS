import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SearchModal({ data, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Ascolta la scorciatoia da tastiera Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!data) return null;

  // Motore di ricerca (cerca in Task, Inventario, Manutenzioni e Salute)
  const searchResults = [];
  const q = query.toLowerCase();

  if (q.length > 1) {
    // Cerca nei Task (Agenda)
    data.tasks?.forEach(t => {
      if (t.title.toLowerCase().includes(q)) searchResults.push({ type: 'Task', text: t.title, icon: '📅', tab: 'calendar' });
    });
    // Cerca nell'Inventario
    data.inventory?.forEach(i => {
      if (i.name.toLowerCase().includes(q) || (i.notes && i.notes.toLowerCase().includes(q))) searchResults.push({ type: 'Inventario', text: i.name, icon: '📦', tab: 'inventory' });
    });
    // Cerca nelle Manutenzioni
    data.maintenances?.forEach(m => {
      if (m.title.toLowerCase().includes(q)) searchResults.push({ type: 'Manutenzione', text: m.title, icon: '🔧', tab: 'inventory' });
    });
    // Cerca nella Cartella Clinica
    data.medical?.forEach(m => {
      if (m.title.toLowerCase().includes(q)) searchResults.push({ type: 'Salute', text: m.title, icon: '🏥', tab: 'health' });
    });
  }

  const handleSelect = (tab) => {
    setActiveTab(tab);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop open" style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '10vh' }} onClick={() => setIsOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="modal-content" 
            style={{ width: '90%', maxWidth: '500px', background: 'var(--bg-secondary)', padding: 0, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🔍</span>
              <input 
                autoFocus
                type="text" 
                placeholder="Cerca ovunque... (Task, Inventario, Salute)" 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn btn-sm" onClick={() => setIsOpen(false)}>ESC</button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {query.length > 1 && searchResults.length === 0 && (
                <div className="stat-label" style={{ padding: '1rem', textAlign: 'center' }}>Nessun risultato trovato.</div>
              )}
              {searchResults.map((res, idx) => (
                <div 
                  key={idx} 
                  className="list-row" 
                  style={{ cursor: 'pointer', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
                  onClick={() => handleSelect(res.tab)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{res.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{res.text}</div>
                      <div className="stat-label" style={{ fontSize: '0.7rem' }}>Modulo: {res.type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SearchModal;