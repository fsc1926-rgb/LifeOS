// src/vault.js

export const Vault = {
  // 1. Trasforma il tuo PIN/Impronta in una chiave crittografica indistruttibile
  async deriveKey(secret) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode("LifeOS_Secure_Salt_2026"), // Sale fisso di sicurezza
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },

  // 2. Cripta i dati (da oggetto Javascript a stringa illeggibile)
  async encrypt(dataObj, secret) {
    const key = await this.deriveKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Vettore di inizializzazione casuale
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(dataObj));

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );

    // Unisce l'IV e il testo cifrato in un'unica stringa base64 da salvare su Firebase
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined)); 
  },

  // 3. Decripta i dati (da stringa illeggibile di Firebase a oggetto Javascript)
  async decrypt(base64String, secret) {
    try {
      const key = await this.deriveKey(secret);
      const combined = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    } catch (error) {
      console.error("Errore di decrittografia! Chiave errata o dati corrotti.");
      return null;
    }
  }
};