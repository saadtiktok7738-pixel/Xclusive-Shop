import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase.js";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useLocation } from "wouter";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email ?? "",
              name: currentUser.displayName ?? "",
              isAdmin: false,
              createdAt: serverTimestamp(),
            });
            setIsAdmin(false);
          } else {
            setIsAdmin(userSnap.data().isAdmin === true);
          }
        } else {
          setIsAdmin(false);
        }

        setUser(currentUser);
      } catch {
        setUser(currentUser);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setLocation("/");
    } catch (error) {
      const code = error?.code || "";

      const popupBlocked =
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment";

      if (popupBlocked) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setLocation("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
