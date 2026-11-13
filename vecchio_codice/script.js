document.addEventListener('DOMContentLoaded', () => {
  const pulsante = document.getElementById('login-biometrico');
  
  if (pulsante) {
    pulsante.addEventListener('click', async () => {
      
      if (!window.PublicKeyCredential) {
        if (typeof App !== 'undefined') App.toast("Sensore biometrico non supportato", "warning");
        return;
      }

      try {
        // Controlliamo se ci sono già impronte salvate nel database dell'app
        const passkeysSalvate = App.data.settings.passkeys || [];

        if (passkeysSalvate.length > 0) {
          // ==========================================
          // FASE 2: LOGIN CON IMPRONTA GIÀ SALVATA
          // ==========================================
          const opzioniDiLogin = {
            publicKey: {
              challenge: new Uint8Array([11, 22, 33, 44, 55, 66, 77, 88]),
              allowCredentials: passkeysSalvate.map(idB64 => ({
                id: App.b64ToBytes(idB64), // Decodifica l'ID salvato
                type: "public-key"
              })),
              userVerification: "required"
            }
          };

          // navigator.credentials.get cerca una chiave esistente
          const credenziale = await navigator.credentials.get(opzioniDiLogin);
          
          // Se arriviamo qui, il sensore ha confermato l'identità!
          document.getElementById('lockScreen').classList.add('hidden');
          if (typeof App !== 'undefined' && App.toast) {
            App.haptic(25);
            App.toast('Bentornato! Sblocco biometrico effettuato 🚀', 'success');
          }

        } else {
          // ==========================================
          // FASE 1: PRIMA REGISTRAZIONE DELL'IMPRONTA
          // ==========================================
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

          // navigator.credentials.create genera la chiave
          const credenziale = await navigator.credentials.create(opzioniDiSicurezza);
          const passkeyId = App.bufToB64(credenziale.rawId);
          
          // Salva la firma nell'ecosistema
          App.data.settings.passkeys = [passkeyId];
          App.saveData();

          document.getElementById('lockScreen').classList.add('hidden');
          if (typeof App !== 'undefined' && App.toast) {
            App.haptic(25);
            App.toast('Nuova impronta salvata nel Cloud!', 'success');
          }
        }

      } catch (errore) {
        console.error("Operazione annullata o fallita:", errore);
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Riconoscimento fallito o annullato', 'danger');
        }
      }
    });
  }
});
