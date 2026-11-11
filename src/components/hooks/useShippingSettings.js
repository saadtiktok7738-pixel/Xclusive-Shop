import { useEffect, useState } from "react";
import { db } from "../lib/firebase.js";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const SETTINGS_DOC = doc(db, "settings", "shipping");

const DEFAULT = {
  type: "free",
  cost: 0,
};

export function useShippingSettings() {
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        if (snap.exists()) setSettings(snap.data());
        setLoading(false);
      },
      () => {
        // Permission-denied for non-admins is expected; fall back to free shipping.
        setSettings(DEFAULT);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveSettings = async (next) => {
    await setDoc(SETTINGS_DOC, next);
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
