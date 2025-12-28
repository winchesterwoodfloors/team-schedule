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
    if (!trimmed) {
      await deleteDoc(docRef);
      await mutate();
      return;
    }

    await setDoc(docRef, {
      date,
      period,
      employee,
      value: trimmed,
    });

    await mutate();
  };

  // Copy source booking to target (keeps source)
  const copySlot = async ({ from, to }) => {
    if (!from?.value?.trim()) return;

    await setDoc(doc(db, "slots", `${to.date}_${to.period}_${to.employee}`), {
      date: to.date,
      period: to.period,
      employee: to.employee,
      value: from.value.trim(),
    });

    await mutate();
  };

  // Move source booking to target (copies then deletes source)
  const moveSlot = async ({ from, to }) => {
    if (!from?.value?.trim()) return;

    // 1) write target
    await setDoc(doc(db, "slots", `${to.date}_${to.period}_${to.employee}`), {
      date: to.date,
      period: to.period,
      employee: to.employee,
      value: from.value.trim(),
    });

    // 2) delete source
    await deleteDoc(doc(db, "slots", `${from.date}_${from.period}_${from.employee}`));

    await mutate();
  };

  return { data, error, upsertSlot, copySlot, moveSlot };
};
