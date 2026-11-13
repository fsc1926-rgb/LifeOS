import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SmartFAB({ setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (tab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const triggerSpotlight = () => {
    setIsOpen(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <div style={{ position: 'fixed', bottom: '85px', right: '20px', zIndex: 999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              alignItems: 'flex-end'
            }}
          >
            <button 
              className="btn btn-sm" 
              onClick={triggerSpotlight} 
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              🔍 Ricerca Globale
            </button>
            <button 
              className="btn btn-sm" 
              onClick={() => handleAction('wallet')} 
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              💸 Nuova Transazione
            </button>
            <button 
              className="btn btn-sm" 
              onClick={() => handleAction('calendar')} 
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              📅 Nuovo Task
            </button>
            <button 
              className="btn btn-sm" 
              onClick={() => handleAction('garage')} 
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              ⛽ Rifornimento Rapido
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          color: 'white',
          border: 'none',
          fontSize: '1.6rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
        title="Azioni Rapide"
      >
        +
      </button>
    </div>
  );
}

export default SmartFAB;