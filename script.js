document.addEventListener('DOMContentLoaded', () => {
  const pulsante = document.getElementById('login-biometrico');
  
  if (pulsante) {
    pulsante.addEventListener('click', async () => {
      
      if (!window.PublicKeyCredential) {
        if (typeof App !== 'undefined') App.toast("Sensore biometrico non supportato", "warning");
        return;
      }

      try {
        const opzioniDiSicurezza = {
          publicKey: {
            challenge: new Uint8Array([11, 22, 33, 44, 55, 66, 77, 88]),
            rp: { name: "LifeOS PWA" },
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

        // 1. Genera l'impronta tramite il sistema operativo
        const credenziale = await navigator.credentials.create(opzioniDiSicurezza);
        
        // 2. Converte l'ID dell'impronta (ArrayBuffer) in testo Base64 usando la tua utility
        const passkeyId = App.bufToB64(credenziale.rawId);
        
        // 3. Salva la chiave nelle impostazioni della TUA app e invia a Firebase
        if (!App.data.settings.passkeys) App.data.settings.passkeys = [];
        // Salviamo la nuova chiave nell'elenco (così puoi avere più dispositivi/impronte)
        App.data.settings.passkeys.push(passkeyId);
        App.saveData(); // Magia: salva in locale e innesca il push su Firestore!

        // 4. Sblocca l'interfaccia utente
        document.getElementById('lockScreen').classList.add('hidden');
        if (typeof App !== 'undefined' && App.toast) {
          App.haptic(25);
          App.toast('Nuova impronta salvata nel Cloud!', 'success');
        }

      } catch (errore) {
        console.error("Operazione annullata o fallita:", errore);
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Registrazione impronta annullata', 'danger');
        }
      }
    });
  }
});
