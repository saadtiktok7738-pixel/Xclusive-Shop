import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  getCountFromServer,
  collection,
  updateDoc,
} from "firebase/firestore";
import { useLocation } from "wouter";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Handle redirect login result
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect sign-in error", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          let assignedRole = "user";

          if (!userSnap.exists()) {
            const usersCount = await getCountFromServer(
              collection(db, "users")
            );

            assignedRole =
              usersCount.data().count === 0 ? "admin" : "user";

            await setDoc(userRef, {
              name: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: assignedRole,
              createdAt: new Date().toISOString(),
            });
          } else {
            const data = userSnap.data();
            assignedRole = data.role || "user";
          }

          setRole(assignedRole);

          // Claim guest orders
          try {
            const raw = localStorage.getItem("pendingGuestOrders");
            if (raw) {
              const ids = JSON.parse(raw);

              if (Array.isArray(ids) && ids.length > 0) {
                for (const oid of ids) {
                  try {
                    const orderRef = doc(db, "orders", oid);
                    const orderSnap = await getDoc(orderRef);

                    if (orderSnap.exists()) {
                      const data = orderSnap.data();

                      await updateDoc(orderRef, {
                        userId: currentUser.uid,
                      });

                      await setDoc(
                        doc(db, "users", currentUser.uid, "orders", oid),
                        {
                          ...data,
                          userId: currentUser.uid,
                          orderId: oid,
                        }
                      );
                    }
                  } catch (e) {
                    console.error("Failed to claim guest order", oid, e);
                  }
                }

                localStorage.removeItem("pendingGuestOrders");
              }
            }
          } catch (e) {
            console.error("Guest order claim error", e);
          }
        } else {
          setRole(null);
        }

        setUser(currentUser);
      } catch (err) {
        console.error("Auth state error", err);
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
        code ===
          "auth/operation-not-supported-in-this-environment";

      if (popupBlocked) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("Redirect sign-in failed", redirectError);
          throw redirectError;
        }
      }

      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setLocation("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin: role === "admin",
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