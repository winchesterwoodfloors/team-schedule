import useSWR from 'swr';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const fetcher = async (date) => {
  const q = query(collection(db, 'slots'), where('date', '==', date));
  const snapshot = await getDocs(q);
  const data = {};
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const key = `${d.period}_${d.employee}`;
    data[key] = { id: docSnap.id, ...d };
  });
  return data;
};

export const useSlots = (date) => {
  const { data, error, mutate } = useSWR(date ? ['slots', date] : null, () => fetcher(date));

  const toggleSlot = async ({ period, employee }) => {
    const key = `${date}_${period}_${employee}`;
    const docRef = doc(db, 'slots', key);
    const existing = data && data[`${period}_${employee}`];
    if (existing) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        date,
        period,
        employee,
        value: true,
      });
    }
    mutate();
  };

  return { data, error, toggleSlot };
};
