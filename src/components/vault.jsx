import React, { useState } from 'react';

// Costanti di sicurezza
const VAULT_CHECK = 'LIFEOS_VAULT_OK_v2';
const ITERATIONS = 250000;

// Utility Crittografiche
const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBytes = (b64) => {
  const s = atob(b64);
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
};
const randSalt = () => bufToB64(crypto.getRandomValues(new Uint8Array(16)));

function Vault({ data, updateData, setActiveTab }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sessionKey, setSessionKey] = useState(null);
  const [pin, setPin] = useState('');
  const [decryptedList, setDecryptedList] = useState([]);

  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  // Controlla se la cassaforte è già stata inizializzata nel database
  const isConfigured = !!(data?.settings?.vaultCheck && data?.settings?.vaultSalt);

  // Deriva la chiave a 256-bit dal PIN a 6 cifre
  const deriveKey = async (pinStr, saltB64) => {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pinStr), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations: ITERATIONS, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  };

  const aesEncrypt = async (key, text) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
    return { iv: bufToB64(iv), ct: bufToB64(ct) };
  };

  const aesDecrypt = async (key, obj) => {
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(obj.iv) }, key, b64ToBytes(obj.ct));
      return new TextDecoder().decode(pt);
    } catch (e) {
      return null;
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return alert('Il PIN deve essere di 6 cifre numeriche');
    try {
      const salt = randSalt();
      const key = await deriveKey(pin, salt);
      const check = await aesEncrypt(key, VAULT_CHECK);
      
      const newData = { ...data };
      if (!newData.settings) newData.settings = {};
      newData.settings.vaultSalt = salt;
      newData.settings.vaultCheck = check;
      newData.vault = []; // Resetta in caso di nuova cassaforte
      
      await updateData(newData);
      setSessionKey(key);
      setIsUnlocked(true);
      setPin('');
      alert('Vault configurato e sbloccato! La crittografia AES-256 è attiva.');
    } catch (err) {
      alert('Errore durante la configurazione del Vault.');
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    try {
      const key = await deriveKey(pin, data.settings.vaultSalt);
      const checkDecrypted = await aesDecrypt(key, data.settings.vaultCheck);
      
      if (checkDecrypted !== VAULT_CHECK) {
        setPin('');
        return alert('PIN Errato! Impossibile decifrare i dati.');
      }
      
      // Se il PIN è corretto, decriptiamo tutti i segreti in RAM (senza salvarli in chiaro!)
      const list = [];
      for (const v of (data.vault || [])) {
        const text = await aesDecrypt(key, v);
        list.push({ ...v, decryptedText: text });
      }
      
      setDecryptedList(list);
      setSessionKey(key);
      setIsUnlocked(true);
      setPin('');
    } catch(err) {
      alert('Errore di decrittografia profonda.');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle || !newText) return;
    try {
      const enc = await aesEncrypt(sessionKey, newText);
      const newSecret = {
        id: 'vlt_' + Date.now(),
        title: newTitle,
        date: new Date().toISOString().split('T')[0],
        iv: enc.iv,
        ct: enc.ct
      };
      
      const newVault = [newSecret, ...(data.vault || [])];
      await updateData({ ...data, vault: newVault });
      
      setDecryptedList([{ ...newSecret, decryptedText: newText }, ...decryptedList]);
      setNewTitle('');
      setNewText('');
    } catch(err) {
      alert('Errore durante il salvataggio cifrato.');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Eliminare definitivamente questo segreto? (Azione irreversibile)')) return;
    const newVault = (data.vault || []).filter(v => v.id !== id);
    await updateData({ ...data, vault: newVault });
    setDecryptedList(decryptedList.filter(v => v.id !== id));
  };

  const lockVault = () => {
    setSessionKey(null);
    setDecryptedList([]);
    setIsUnlocked(false);
  };

  // SCHERMATA DI SBLOCCO / SETUP
  if (!isUnlocked) {
    return (
      <div className="module-section active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
        <div className="pin-box">
          <div className="card-header" style={{ justifyContent: 'center' }}>
            <h2 className="card-title">🔐 {isConfigured ? 'Sblocca Cassaforte' : 'Attiva Deep Vault'}</h2>
          </div>
          <p className="stat-label" style={{ marginBottom: '1rem' }}>
            {isConfigured 
              ? 'Inserisci il PIN della cassaforte (6 cifre) per decifrare i dati.' 
              : 'Crea un PIN a 6 cifre per cifrare i dati. Se lo dimentichi, i segreti saranno persi per sempre.'}
          </p>
          <form onSubmit={isConfigured ? handleUnlock : handleSetup}>
            <input 
              type="password" 
              className="pin-input" 
              inputMode="numeric" 
              maxLength="6" 
              placeholder="••••••" 
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {isConfigured ? 'Sblocca' : 'Configura PIN e Cripta'}
            </button>
            <button type="button" className="btn" style={{ width: '100%' }} onClick={() => setActiveTab('hub')}>
              ← Torna all'Hub
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SCHERMATA VAULT SBLOCCATO
  return (
    <div className="module-section active">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <div className="card-title">🔐 Deep Vault (Sbloccato)</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={lockVault}>🔒 Blocca Vault</button>
          <button className="btn btn-sm" onClick={() => setActiveTab('hub')}>← Hub</button>
        </div>
      </div>

      <div className="bento-grid">
        <div className="bento-card col-span-4">
          <div className="card-header"><div className="card-title">➕ Aggiungi Segreto Cifrato</div></div>
          <form onSubmit={handleAdd}>
            <input type="text" className="input" placeholder="Titolo (es. PIN Bancomat, PUK)" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
            <textarea className="input" rows="4" placeholder="Dati segreti da criptare..." value={newText} onChange={e => setNewText(e.target.value)} required></textarea>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>🔐 Cripta (AES-256) e Salva</button>
          </form>
          <div className="stat-label" style={{ marginTop: '1rem' }}>
            Il contenuto è cifrato con AES-256-GCM. Il PIN non viene mai salvato su Cloud.
          </div>
        </div>

        <div className="bento-card col-span-8">
          <div className="card-header"><div className="card-title">🗄️ I Tuoi Segreti (Decriptati in RAM)</div></div>
          <div className="item-list sensitive" style={{ maxHeight: '400px' }}>
            {decryptedList.length === 0 ? (
              <div className="stat-label" style={{ textAlign: 'center', padding: '1.5rem' }}>Nessun segreto in cassaforte.</div>
            ) : (
              decryptedList.map(v => (
                <div key={v.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>🔑 {v.title}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.84rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                      {v.decryptedText === null ? '🔒 [Errore decifrazione]' : v.decryptedText}
                    </div>
                    <div className="stat-label" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                      {v.date.split('-').reverse().join('/')}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v.id)}>🗑️</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Vault;