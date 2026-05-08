// DataContext — provides static catalogue data with caching

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase.js";
import { appCache, TTL } from "../lib/cache.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const KEY_PRODUCTS = "static:products";
const KEY_CATEGORIES = "static:categories";
const KEY_BANNERS = "static:banners";

const DataContext = createContext(undefined);

// ── helpers ─────────────────────────────

function toFirebaseError(err) {
  if (!err || typeof err !== "object") return null;

  const code = err.code;

  if (code === "resource-exhausted") {
    return "Firebase quota exceeded. Showing cached data.";
  }
  if (code === "unavailable" || code === "failed-precondition") {
    return "You appear to be offline. Showing cached data.";
  }

  return null;
}

async function fetchProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchCategories() {
  const snap = await getDocs(collection(db, "categories"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchBanners() {
  const snap = await getDocs(query(collection(db, "banners"), orderBy("order", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── provider ─────────────────────────────

export function DataProvider({ children }) {
  const [products, setProducts] = useState(appCache.get(KEY_PRODUCTS) || []);
  const [categories, setCategories] = useState(appCache.get(KEY_CATEGORIES) || []);
  const [banners, setBanners] = useState(appCache.get(KEY_BANNERS) || []);

  const [loading, setLoading] = useState(!appCache.has(KEY_BANNERS) || !appCache.has(KEY_CATEGORIES));
  const [offline, setOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchingRef = useRef(false);

  const loadAll = async (force = false) => {
    if (fetchingRef.current) return;

    const needProducts = force || appCache.isStale(KEY_PRODUCTS);
    const needCategories = force || appCache.isStale(KEY_CATEGORIES);
    const needBanners = force || appCache.isStale(KEY_BANNERS);

    if (!needProducts && !needCategories && !needBanners) return;

    fetchingRef.current = true;

    // ── Phase 1: banners + categories (unblocks homepage render immediately) ──
    try {
      const [freshBanners, freshCategories] = await Promise.all([
        needBanners ? fetchBanners() : Promise.resolve(appCache.get(KEY_BANNERS)),
        needCategories ? fetchCategories() : Promise.resolve(appCache.get(KEY_CATEGORIES)),
      ]);

      if (needBanners) {
        appCache.set(KEY_BANNERS, freshBanners, TTL.BANNERS);
        setBanners(freshBanners);
      }
      if (needCategories) {
        appCache.set(KEY_CATEGORIES, freshCategories, TTL.CATEGORIES);
        setCategories(freshCategories);
      }

      setOffline(false);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage(toFirebaseError(err) || "Failed to load data");
      if (!appCache.has(KEY_BANNERS)) setOffline(true);
    } finally {
      setLoading(false);
    }

    // ── Phase 2: products in background (does not block rendering) ──
    if (needProducts) {
      try {
        const freshProducts = await fetchProducts();
        appCache.set(KEY_PRODUCTS, freshProducts, TTL.PRODUCTS);
        setProducts(freshProducts);
      } catch (err) {
        console.error(err);
      }
    }

    fetchingRef.current = false;
  };

  const refreshProducts = useCallback(async () => {
    appCache.invalidate(KEY_PRODUCTS);

    try {
      const fresh = await fetchProducts();
      appCache.set(KEY_PRODUCTS, fresh, TTL.PRODUCTS);
      setProducts(fresh);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {

    loadAll();

    const onVisibility = () => {
      if (document.visibilityState === "visible") loadAll();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <DataContext.Provider
      value={{
        products,
        categories,
        banners,
        loading,
        offline,
        errorMessage,
        refreshProducts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}