import useSWR from "swr";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Fetch slots for a date range (inclusive) using ISO YYYY-MM-DD strings.
 * Firestore can query ranges on a single field.
 */
const fetcherRange = async (startDate, endDate) => {
  const q = query(
    collection(db, "slots"),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );

  const snapshot = await getDocs(q);
  const data = {};
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const key = `${d.date}_${d.period}_${d.employee}`;
    data[key] = { id: docSnap.id, ...d };
  });
  return data;
};

export const useSlotsRange = (startDate, endDate) => {
  const key = startDate && endDate ? ["slotsRange", startDate, endDate] : null;

  const { data, error, mutate } = useSWR(
    key,
    () => fetcherRange(startDate, endDate),
    { revalidateOnFocus: true }
  );

  const upsertSlot = async ({ date, period, employee, value }) => {
    const docId = `${date}_${period}_${employee}`;
    const docRef = doc(db, "slots", docId);

    const trimmed = (value ?? "").trim();

    // Empty -> delete booking
    if (!trimmed) {
      await deleteDoc(docRef);
      await mutate();
      return;
    }

    await setDoc(docRef, {
      date,
      period,
      employee,
      value: trimmed, // store booking details as text
    });

    await mutate();
  };

  return { data, error, upsertSlot };
};
