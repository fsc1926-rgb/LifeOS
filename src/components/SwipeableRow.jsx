import React from 'react';
import { motion, useAnimation } from 'framer-motion';

function SwipeableRow({ children, onDelete }) {
  const controls = useAnimation();

  const handleDragEnd = (event, info) => {
    // Se l'utente trascina verso sinistra per più di 80 pixel
    if (info.offset.x < -80) {
      // Fai scivolare via l'elemento
      controls.start({ x: -window.innerWidth, opacity: 0 });
      // Attendi mezzo secondo per l'animazione, poi esegui l'azione
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      // Se non ha trascinato abbastanza, fallo tornare al suo posto
      controls.start({ x: 0 });
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', marginBottom: '8px', borderRadius: '8px' }}>
      {/* Background rivelato dallo swipe */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%',
        backgroundColor: 'var(--danger)', color: 'white', display: 'flex',
        justifyContent: 'flex-end', alignItems: 'center', paddingRight: '1.5rem',
        fontWeight: 'bold', zIndex: 0, borderRadius: '8px'
      }}>
        ✅ Spunta
      </div>
      
      {/* L'elemento trascinabile */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.8, right: 0 }} // Resiste a destra, scivola a sinistra
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ zIndex: 1, position: 'relative', background: 'var(--bg-secondary)', borderRadius: '8px', touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeableRow;