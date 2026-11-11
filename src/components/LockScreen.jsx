import React, { useState } from 'react';

// Utility per convertire le chiavi crittografiche
const bufToB64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const b64ToBytes = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

function LockScreen({ onUnlock }) {
  const [statusMsg, setStatusMsg] = useState('Usa la tua impronta per accedere');

  const handleBiometricLogin = async () => {
    if (!window.PublicKeyCredential) {
      setStatusMsg("Sensore biometrico non supportato ❌");
      return;
    }

    try {
      setStatusMsg("In attesa dell'impronta...");
      // Recupero temporaneo delle chiavi (poi ricollegheremo Firebase)
      const passkeysSalvate = JSON.parse(localStorage.getItem('lifeos_passkeys') || '[]');

      if (passkeysSalvate.length > 0) {
        // LOGIN: Chiave già registrata
        const opzioniDiLogin = {
          publicKey: {
            challenge: new Uint8Array([11, 22, 33, 44, 55, 66, 77, 88]),
            allowCredentials: passkeysSalvate.map(idB64 => ({
              id: b64ToBytes(idB64),
              type: "public-key"
            })),
            userVerification: "required"
          }
        };
        await navigator.credentials.get(opzioniDiLogin);
        onUnlock(); // Sblocco riuscito!

      } else {
        // REGISTRAZIONE: Prima volta
        const opzioniDiSicurezza = {
          publicKey: {
            challenge: new Uint8Array([11, 22, 33, 44, 55, 66, 77, 88]),
            rp: { name: "LifeOS React" },
            user: {
              id: new Uint8Array([1, 2, 3, 4]),
              name: "admin@lifeos.com",
              displayName: "Master User"
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 },
              { type: "public-key", alg: -257 }
            ],
            authenticatorSelection: { authenticatorAttachment: "platform" }
          }
        };

        const credenziale = await navigator.credentials.create(opzioniDiSicurezza);
        const passkeyId = bufToB64(credenziale.rawId);
        
        localStorage.setItem('lifeos_passkeys', JSON.stringify([passkeyId]));
        onUnlock(); // Registrazione e sblocco riusciti!
      }
    } catch (errore) {
      console.error(errore);
      setStatusMsg('Riconoscimento fallito o annullato ❌');
    }
  };

  return (
    <div id="lockScreen">
      <div className="pin-box">
        <h2 style={{ marginBottom: '1rem' }}>LifeOS Sicurezza</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '20px' }}>
          {statusMsg}
        </p>
        <button className="btn btn-primary" onClick={handleBiometricLogin}>
          👆 Sblocca con Impronta
        </button>
        {/* Pulsante di emergenza provvisorio per evitare di rimanere chiusi fuori durante lo sviluppo */}
        <button className="btn" style={{marginTop: '1rem', width: '100%', fontSize: '0.8rem'}} onClick={onUnlock}>
          Salta (Debug)
        </button>
      </div>
    </div>
  );
}

export default LockScreen;