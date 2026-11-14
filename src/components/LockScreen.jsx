import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

function LockScreen({ onUnlock }) {
  // Due sole modalità visibili: 'pin' e 'account' (Google + Email)
  const [activeMethod, setActiveMethod] = useState('pin'); // 'pin' | 'account'
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Email / Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Per evitare loop di tentativi automatici
  const autoPromptTriggered = useRef(false);

  // ----------------------------------------------------
  // UTILITY WEBAUTHN PER S25
  // ----------------------------------------------------
  const generateRandomBuffer = () => {
    const arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);
    return arr;
  };

  // Rilevamento implicito e richiesta automatica impronta per Samsung S25
  const triggerS25Fingerprint = async (isAuto = false) => {
    if (!window.PublicKeyCredential) return;
    try {
      const isRegistered = localStorage.getItem('lifeos_bio_setup');
      if (isRegistered) {
        const publicKey = {
          challenge: generateRandomBuffer(),
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname
        };
        await navigator.credentials.get({ publicKey });
        onUnlock();
      } else if (!isAuto) {
        // Se non ancora registrato e invocato manualmente:
        const publicKey = {
          challenge: generateRandomBuffer(),
          rp: { name: "LifeOS Galaxy S25", id: window.location.hostname },
          user: {
            id: generateRandomBuffer(),
            name: "s25ultra@lifeos.local",
            displayName: "Samsung Galaxy S25 Ultra"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        };
        await navigator.credentials.create({ publicKey });
        localStorage.setItem('lifeos_bio_setup', 'true');
        onUnlock();
      }
    } catch (err) {
      console.log("Rilevamento biometrico S25:", err.name);
      // Se era un tentativo automatico e l'utente ha toccato annulla,
      // rimane pulito sulla schermata PIN senza bloccare nulla.
    }
  };

  // Registrazione silente della biometria S25 al primo sblocco riuscito
  const autoRegisterS25Biometrics = async () => {
    if (window.PublicKeyCredential && bioAvailable && !localStorage.getItem('lifeos_bio_setup')) {
      try {
        const publicKey = {
          challenge: generateRandomBuffer(),
          rp: { name: "LifeOS Galaxy S25", id: window.location.hostname },
          user: {
            id: generateRandomBuffer(),
            name: "s25ultra@lifeos.local",
            displayName: "Samsung Galaxy S25 Ultra"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        };
        await navigator.credentials.create({ publicKey });
        localStorage.setItem('lifeos_bio_setup', 'true');
      } catch (e) {
        // Ignora silenziosamente se rifiutato
      }
    }
  };

  useEffect(() => {
    if (localStorage.getItem('lifeos_pin')) {
      setIsSetup(true);
    }

    // Rileva automaticamente se il dispositivo ha il sensore biometrico (es. S25 Ultra)
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          setBioAvailable(!!available);
          // Se siamo su S25 e la biometria è già attiva, avvia automaticamente la scansione dell'impronta!
          if (available && !autoPromptTriggered.current && localStorage.getItem('lifeos_bio_setup')) {
            autoPromptTriggered.current = true;
            setTimeout(() => {
              triggerS25Fingerprint(true);
            }, 300);
          }
        })
        .catch(() => setBioAvailable(false));
    }
  }, []);

  // ----------------------------------------------------
  // GESTIONE PIN
  // ----------------------------------------------------
  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');

      if (newPin.length === 6) {
        setTimeout(() => verifyPin(newPin), 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = async (enteredPin) => {
    if (!isSetup) {
      localStorage.setItem('lifeos_pin', enteredPin);
      setIsSetup(true);
      setSuccessMsg('PIN salvato con successo!');
      await autoRegisterS25Biometrics();
      setTimeout(() => onUnlock(), 300);
    } else {
      const savedPin = localStorage.getItem('lifeos_pin');
      if (enteredPin === savedPin) {
        await autoRegisterS25Biometrics();
        onUnlock();
      } else {
        setError('PIN errato. Riprova.');
        setPin('');
      }
    }
  };

  // ----------------------------------------------------
  // GOOGLE SIGN-IN
  // ----------------------------------------------------
  const handleGoogleSignIn = async () => {
    setError('');
    setIsProcessing(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email) {
        localStorage.setItem('lifeos_user_email', user.email);
        if (user.displayName) localStorage.setItem('lifeos_user_name', user.displayName);
      }
      setSuccessMsg('Accesso Google effettuato!');
      await autoRegisterS25Biometrics();
      setTimeout(() => onUnlock(), 300);
    } catch (err) {
      console.error("Errore Google Auth:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Accesso Google annullato.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Il browser ha bloccato il popup di Google. Abilita i popup nelle impostazioni del browser.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`Dominio non autorizzato (${window.location.hostname}). Va aggiunto su Firebase Console -> Authentication -> Impostazioni -> Domini autorizzati.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Provider Google non abilitato su Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setError(`Errore Google (${err.code || 'sconosciuto'}): ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // EMAIL & PASSWORD
  // ----------------------------------------------------
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Inserisci email e password.');
      return;
    }
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setIsProcessing(true);
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('Account creato con successo!');
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('Accesso effettuato con successo!');
      }
      const user = userCredential.user;
      if (user && user.email) {
        localStorage.setItem('lifeos_user_email', user.email);
      }
      await autoRegisterS25Biometrics();
      setTimeout(() => onUnlock(), 300);
    } catch (err) {
      console.error("Errore Email Auth:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email o password non corretti.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Nessun account trovato. Clicca su "Crea un nuovo account".');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email già registrata. Effettua il login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato email non valido.');
      } else {
        setError(`Errore: ${err.message || err.code}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-primary, #000000)',
      color: 'var(--text-primary, #ffffff)',
      padding: '1.5rem',
      position: 'relative',
      overflowY: 'auto'
    }}>

      {/* CARD PRINCIPALE */}
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'var(--bg-card, #0d121c)',
        border: '1px solid var(--border-color, rgba(59, 130, 246, 0.2))',
        borderRadius: '24px',
        padding: '2rem 1.5rem',
        boxShadow: 'var(--shadow-lg, 0 16px 40px rgba(0,0,0,0.8))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>

        {/* LOGO E TITOLO */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'var(--accent-gradient, linear-gradient(135deg, #1d4ed8, #3b82f6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 900,
            margin: '0 auto 0.75rem auto',
            color: '#ffffff',
            boxShadow: '0 8px 25px var(--accent-glow, rgba(59, 130, 246, 0.45))'
          }}>
            L
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>LifeOS</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Autenticazione & Accesso Sicuro
          </p>
        </div>

        {/* DUE SOLE TABS: PIN E ACCOUNT UNIFICATO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          width: '100%',
          background: 'var(--btn-sub-bg, #0e1526)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          border: '1px solid var(--btn-sub-border, rgba(59, 130, 246, 0.2))'
        }}>
          {/* TAB 1: PIN */}
          <button
            type="button"
            onClick={() => { setActiveMethod('pin'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.7rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              background: activeMethod === 'pin' ? 'var(--accent-gradient)' : 'transparent',
              color: activeMethod === 'pin' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🔢</span>
            <span>PIN Rapido</span>
          </button>

          {/* TAB 2: ACCOUNT UNIFICATO (GOOGLE & EMAIL) */}
          <button
            type="button"
            onClick={() => { setActiveMethod('account'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.7rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              background: activeMethod === 'account' ? 'var(--accent-gradient)' : 'transparent',
              color: activeMethod === 'account' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>👤</span>
            <span>Account (Google / Email)</span>
          </button>
        </div>

        {/* FEEDBACK MESSAGES */}
        {error && (
          <div style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            width: '100%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10b981',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        {/* ==================================================== */}
        {/* METODO 1: PIN KEYPAD                                 */}
        {/* ==================================================== */}
        {activeMethod === 'pin' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {!isSetup ? 'Imposta il tuo PIN a 6 cifre' : 'Inserisci il PIN per sbloccare'}
            </p>

            {/* PALLINI DEL PIN */}
            <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.75rem' }}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: pin.length > i ? 'var(--accent-primary, #3b82f6)' : 'transparent',
                    border: pin.length > i ? 'none' : '2px solid var(--border-color, rgba(255, 255, 255, 0.25))',
                    boxShadow: pin.length > i ? '0 0 10px var(--accent-glow)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>

            {/* TASTIERINO NUMERICO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.85rem',
              maxWidth: '280px',
              width: '100%'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'var(--btn-sub-bg, #0e1526)',
                    border: '1px solid var(--btn-sub-border, rgba(59, 130, 246, 0.25))',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.1s ease'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {num}
                </button>
              ))}

              {/* Rilevamento / sblocco rapido con impronta S25 se supportato */}
              <button
                type="button"
                onClick={() => triggerS25Fingerprint(false)}
                title="Tocca per verificare l'impronta"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary, #3b82f6)',
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                👆
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'var(--btn-sub-bg, #0e1526)',
                  border: '1px solid var(--btn-sub-border, rgba(59, 130, 246, 0.25))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                0
              </button>

              {/* Tasto Backspace */}
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ⌫
              </button>
            </div>

            {/* Bypass per test desktop */}
            <button
              type="button"
              onClick={() => onUnlock()}
              style={{
                marginTop: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Accesso rapido di prova (Bypass test)
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* METODO 2: MENU UNIFICATO (GOOGLE & EMAIL/PASSWORD)   */}
        {/* ==================================================== */}
        {activeMethod === 'account' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', textAlign: 'center', marginBottom: '1.25rem' }}>
              Accedi con il tuo account Gmail oppure inserisci le tue credenziali email.
            </p>

            {/* 1. PULSANTE GOOGLE SIGN-IN RAPIDO */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '0.78rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: '#ffffff',
                color: '#1f2937',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isProcessing ? 'Connessione...' : 'Accedi con Google / Gmail'}</span>
            </button>

            {/* SEPARATORE CON TESTO */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              margin: '1.25rem 0 1rem 0'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255,255,255,0.15))' }} />
              <span style={{
                padding: '0 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted, #94a3b8)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                oppure con credenziali
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255,255,255,0.15))' }} />
            </div>

            {/* 2. FORM CREDENZIALI EMAIL & PASSWORD */}
            <form onSubmit={handleEmailAuth} style={{ width: '100%' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Almeno 6 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ marginBottom: 0 }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isProcessing}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem', marginBottom: '0.75rem' }}
              >
                {isProcessing
                  ? 'Verifica in corso...'
                  : isRegistering
                  ? '✨ Crea Nuovo Account'
                  : '🔐 Accedi con Credenziali'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary, #3b82f6)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isRegistering
                    ? 'Hai già un account? Clicca per accedere'
                    : 'Nuovo utente? Crea un account con credenziali'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}

export default LockScreen;
