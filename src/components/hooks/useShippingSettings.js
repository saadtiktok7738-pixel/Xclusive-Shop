import { useEffect, useState } from "react";
import { db } from "../lib/firebase.js";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const SETTINGS_DOC = doc(db, "settings", "shipping");

const DEFAULT = {
  type: "free",
  cost: 0,
};

/**
 * Shipping settings hook (Firestore realtime)
 */
export function useShippingSettings() {
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        setSettings(snap.exists() ? snap.data() : DEFAULT);
        setLoading(false);
      },
      () => setLoading(false)
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