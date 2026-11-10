// Questo comando aspetta che tutto l'HTML sia stato caricato
document.addEventListener('DOMContentLoaded', () => {
  
  const pulsante = document.getElementById('login-biometrico');
  
  // Controlliamo che il pulsante esista davvero nella pagina
  if (pulsante) {
    pulsante.addEventListener('click', async () => {
      
      if (!window.PublicKeyCredential) {
        alert("Il tuo dispositivo o browser non supporta l'accesso biometrico.");
        return;
      }

      try {
        const opzioniDiSicurezza = {
          publicKey: {
            challenge: new Uint8Array([11, 22, 33, 44, 55, 66, 77, 88]),
            rp: { name: "LifeOS PWA" },
            user: {
              id: new Uint8Array([1, 2, 3, 4]),
              name: "test@lifeos.com",
              displayName: "Utente di Test"
            },
            pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
            authenticatorSelection: { authenticatorAttachment: "platform" }
          }
        };

        const credenziale = await navigator.credentials.create(opzioniDiSicurezza);
        console.log("Successo! Dati crittografati generati:", credenziale);
        alert("Impronta riconosciuta!");

      } catch (errore) {
        console.error("Operazione annullata o fallita:", errore);
      }
    });
  }
});