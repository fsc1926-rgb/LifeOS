import React, { useState, useEffect } from 'react';

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isBioRegistered, setIsBioRegistered] = useState(false);

  useEffect(() => {
    // Controlla se esiste già un PIN salvato in locale
    if (localStorage.getItem('lifeos_pin')) {
      setIsSetup(true);
    }
    if (localStorage.getItem('lifeos_bio_setup')) {
      setIsBioRegistered(true);
    }
    
    // Controlla se il dispositivo supporta l'impronta digitale/FaceID
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(res => setBioAvailable(res))
        .catch(() => setBioAvailable(false));
    }
  }, []);

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');

      // Se ha inserito 6 cifre, verifica o salva il PIN
      if (newPin.length === 6) {
        setTimeout(() => verifyPin(newPin), 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = (enteredPin) => {
    if (!isSetup) {
      // Primo accesso: imposta il PIN per la prima volta
      localStorage.setItem('lifeos_pin', enteredPin);
      onUnlock();
    } else {
      // Accessi successivi: verifica il PIN
      const savedPin = localStorage.getItem('lifeos_pin');
      if (enteredPin === savedPin) {
        onUnlock();
      } else {
        setError('PIN errato. Riprova.');
        setPin('');
      }
    }
  };

  // ----------------------------------------------------
  // INTEGRAZIONE IMPRONTA DIGITALE (WebAuthn)
  // ----------------------------------------------------
  const generateRandomBuffer = () => {
    const arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);
    return arr;
  };

  const handleBiometricAuth = async () => {
    setError('');
    try {
      if (!isBioRegistered) {
        // 1. REGISTRAZIONE DELL'IMPRONTA (Prima volta)
        const publicKey = {
          challenge: generateRandomBuffer(),
          rp: { name: "LifeOS", id: window.location.hostname },
          user: {
            id: generateRandomBuffer(),
            name: "utente@lifeos",
            displayName: "Utente LifeOS"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        };
        await navigator.credentials.create({ publicKey });
        localStorage.setItem('lifeos_bio_setup', 'true');
        setIsBioRegistered(true);
        onUnlock();
      } else {
        // 2. ACCESSO CON IMPRONTA (Volte successive)
        const publicKey = {
          challenge: generateRandomBuffer(),
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname
        };
        await navigator.credentials.get({ publicKey });
        onUnlock();
      }
    } catch (err) {
      console.error("Errore biometria:", err);
      setError("Autenticazione biometrica fallita o annullata.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-primary, #0b0f19)',
      color: 'white',
      padding: '2rem'
    }}>
      
      {/* LOGO E TITOLO */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 900, margin: '0 auto 1rem auto',
          boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)'
        }}>L</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>LifeOS</h1>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
          {!isSetup ? 'Imposta un nuovo PIN a 6 cifre' : 'Inserisci il PIN per sbloccare'}
        </p>
      </div>

      {/* PALLINI DEL PIN */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            width: '16px', height: '16px', borderRadius: '50%',
            background: pin.length > i ? 'var(--accent-primary, #8b5cf6)' : 'transparent',
            border: pin.length > i ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s ease'
          }} />
        ))}
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', fontWeight: 600 }}>{error}</div>}

      {/* TASTIERINO NUMERICO (Custom per Mobile) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        maxWidth: '300px',
        width: '100%'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            style={{
              width: '75px', height: '75px', borderRadius: '50%',
              background: 'var(--bg-secondary, #131b2e)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'white', fontSize: '1.8rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          >
            {num}
          </button>
        ))}
        
        {/* TASTO IMPRONTA DIGITALE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {bioAvailable && isSetup && (
            <button
              onClick={handleBiometricAuth}
              style={{
                width: '65px', height: '65px', borderRadius: '50%',
                background: 'transparent', border: 'none', color: 'var(--accent-primary, #8b5cf6)',
                fontSize: '2rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title={isBioRegistered ? "Accedi con Impronta" : "Registra Impronta"}
            >
              {isBioRegistered ? '👆' : '➕👆'}
            </button>
          )}
        </div>

        <button
          onClick={() => handleKeyPress('0')}
          style={{
            width: '75px', height: '75px', borderRadius: '50%',
            background: 'var(--bg-secondary, #131b2e)', border: '1px solid rgba(255,255,255,0.05)',
            color: 'white', fontSize: '1.8rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          0
        </button>

        {/* TASTO CANCELLA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={handleDelete}
            style={{
              width: '65px', height: '65px', borderRadius: '50%',
              background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)',
              fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ⌫
          </button>
        </div>
      </div>

    </div>
  );
}

export default LockScreen;