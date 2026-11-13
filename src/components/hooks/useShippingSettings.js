import { useEffect, useState } from "react";
import { db, hasFirebaseConfig } from "../lib/firebase.js";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const DEFAULT = {
  type: "free",
  cost: 0,
};

export function useShippingSettings() {
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false);
      return;
    }

    const SETTINGS_DOC = doc(db, "settings", "shipping");

    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        if (snap.exists()) setSettings(snap.data());
        setLoading(false);
      },
      () => {
        setSettings(DEFAULT);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveSettings = async (next) => {
    if (!hasFirebaseConfig) return;
    await setDoc(doc(db, "settings", "shipping"), next);
  };

  const shippingCost =
    settings.type === "free" ? 0 : (settings.cost || 0);

  return {
    settings,
    loading,
    shippingCost,
    saveSettings,
  };
}
