import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const DOC_REF = doc(db, 'lifeos', 'main_user_data');
const LOCAL_KEY = 'LIFEOS_REACT_BACKUP';

export const loadDataFromCloud = async () => {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Offline o errore Firebase, uso cache locale:', err);
  }
  const local = localStorage.getItem(LOCAL_KEY);
  return local ? JSON.parse(local) : null;
};

export const saveDataToCloud = async (data) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  try {
    await setDoc(DOC_REF, data, { merge: true });
  } catch (err) {
    console.warn('Salvataggio Cloud rimandato (offline):', err);
  }
};