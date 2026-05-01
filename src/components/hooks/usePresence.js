import { useEffect } from "react";
import { db } from "../lib/firebase.js";
import { doc, setDoc } from "firebase/firestore";

const HEARTBEAT_MS = 25000;
const SESSION_KEY = "mslal_visitor_id";

/**
 * Create or reuse visitor session ID
 */
function getOrCreateVisitorId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);

    if (!id) {
      id =
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 10);

      sessionStorage.setItem(SESSION_KEY, id);
    }

    return id;
  } catch {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }
}

/**
 * Presence tracking hook (Firestore heartbeat)
 * Used for active users tracking in admin panel
 */
export function usePresence() {
  useEffect(() => {
    const id = getOrCreateVisitorId();
    const ref = doc(db, "presence", id);

    const beat = () => {
      setDoc(
        ref,
        { lastSeen: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    };

    beat();

    const interval = setInterval(beat, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        beat();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}