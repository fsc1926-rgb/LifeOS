import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Vault } from "./vault";

// Usiamo un ID fisso per il tuo documento nel database
const USER_ID = "master_user_01";
// Questa è la chiave crittografica temporanea per decifrare i dati in fase di sviluppo
const SECRET_KEY = "LifeOS_Super_Secret_Key_2026";

export const DataService = {
  // 1. Carica e decripta i dati dal Cloud
  async loadData() {
    try {
      const docRef = doc(db, "users", USER_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const encryptedString = docSnap.data().payload;
        const decryptedData = await Vault.decrypt(encryptedString, SECRET_KEY);
        console.log("Dati scaricati e decriptati dal Cloud! 🔓");
        return decryptedData;
      } else {
        console.log("Nessun salvataggio trovato sul Cloud. Creo un nuovo profilo.");
        return this.getDefaultData();
      }
    } catch (error) {
      console.error("Errore durante il caricamento dal Cloud:", error);
      return this.getDefaultData();
    }
  },

  // 2. Cripta e salva i dati sul Cloud
  async saveData(dataObj) {
    try {
      const encryptedString = await Vault.encrypt(dataObj, SECRET_KEY);
      const docRef = doc(db, "users", USER_ID);
      
      await setDoc(docRef, {
        payload: encryptedString,
        lastSync: new Date().toISOString()
      });
      
      console.log("Dati criptati e salvati con successo su Firebase! ☁️🔒");
      return true;
    } catch (error) {
      console.error("Errore durante il salvataggio sul Cloud:", error);
      return false;
    }
  },

  // 3. Struttura dati di base se il database è vuoto
  getDefaultData() {
    return {
      wallet: {
        totalBalance: 0,
        accounts: []
      },
      garage: {
        vehicles: []
      },
      settings: {
        theme: 'dark'
      }
    };
  }
};