import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// La tua configurazione ufficiale di LifeOS
const firebaseConfig = {
  apiKey: "AIzaSyAyK2bg-deBo7X0PQC0tv4GnVf29F_Uty0",
  authDomain: "lifeos-fef8d.firebaseapp.com",
  projectId: "lifeos-fef8d",
  storageBucket: "lifeos-fef8d.firebasestorage.app",
  messagingSenderId: "935696409557",
  appId: "1:935696409557:web:4da686e46959988c11135c"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta il database (Firestore) per poterlo usare negli altri componenti
export const db = getFirestore(app);