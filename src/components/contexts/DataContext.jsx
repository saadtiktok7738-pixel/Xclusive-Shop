// DataContext — provides static catalogue data with caching

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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

  const [loading, setLoading] = useState(!appCache.has(KEY_PRODUCTS));
  const [offline, setOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchingRef = useRef(false);

  const loadAll = async (force = false) => {
    if (fetchingRef.current) return;

    const needProducts = force || appCache.isStale(KEY_PRODUCTS);
    const needCategories = force || appCache.isStale(KEY_CATEGORIES);
    const needBanners = force || appCache.isStale(KEY_BANNERS);

    if (!needProducts && !needCategories && !needBanners) return;

    if (!appCache.has(KEY_PRODUCTS)) setLoading(true);

    fetchingRef.current = true;

    try {
      const [freshProducts, freshCategories, freshBanners] = await Promise.all([
        needProducts ? fetchProducts() : appCache.get(KEY_PRODUCTS),
        needCategories ? fetchCategories() : appCache.get(KEY_CATEGORIES),
        needBanners ? fetchBanners() : appCache.get(KEY_BANNERS),
      ]);

      if (needProducts) {
        appCache.set(KEY_PRODUCTS, freshProducts, TTL.PRODUCTS);
        setProducts(freshProducts);
      }

      if (needCategories) {
        appCache.set(KEY_CATEGORIES, freshCategories, TTL.CATEGORIES);
        setCategories(freshCategories);
      }

      if (needBanners) {
        appCache.set(KEY_BANNERS, freshBanners, TTL.BANNERS);
        setBanners(freshBanners);
      }

      setOffline(false);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage(toFirebaseError(err) || "Failed to load data");

      if (!appCache.has(KEY_PRODUCTS)) setOffline(true);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    appCache.invalidate(KEY_PRODUCTS);

    try {
      const fresh = await fetchProducts();
      appCache.set(KEY_PRODUCTS, fresh, TTL.PRODUCTS);
      setProducts(fresh);
    } catch (err) {
      console.error(err);
    }
  };

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