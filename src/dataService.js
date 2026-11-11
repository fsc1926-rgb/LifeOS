import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Vault } from "./vault";

const USER_ID = "master_user_01";
const SECRET_KEY = "LifeOS_Super_Secret_Key_2026";

export const DataService = {
  async loadData() {
    try {
      const docRef = doc(db, "users", USER_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const decryptedData = await Vault.decrypt(docSnap.data().payload, SECRET_KEY);
        // Assicuriamoci che abbia la struttura completa anche se è un vecchio salvataggio di test
        return { ...this.getDefaultData(), ...decryptedData };
      } else {
        return this.getDefaultData();
      }
    } catch (error) {
      console.error("Errore caricamento:", error);
      return this.getDefaultData();
    }
  },

  async saveData(dataObj) {
    try {
      const encryptedString = await Vault.encrypt(dataObj, SECRET_KEY);
      await setDoc(doc(db, "users", USER_ID), {
        payload: encryptedString,
        lastSync: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Errore salvataggio:", error);
      return false;
    }
  },

  // LA VERA STRUTTURA DATI DELLA TUA APP
  getDefaultData() {
    return {
      settings: { theme: 'dark' },
      accounts: [{ id: 'acc_1', name: 'Conto Principale', balance: 0 }],
      transactions: [],
      subscriptions: [],
      vehicles: [{ id: 'v_1', name: 'La Mia Auto', plate: 'AA 000 AA', km: 0 }],
      activeVehicleId: 'v_1',
      habits: [],
      tasks: [],
      journal: [],
      inventory: [],
      maintenances: [],
      nutrition: [],
      weights: [],
      medical: [],
      vault: [],
      lastModified: null
    };
  }
};