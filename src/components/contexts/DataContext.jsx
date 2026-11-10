// DataContext — provides static catalogue data with caching

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase.js";
import { appCache, TTL } from "../lib/cache.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const KEY_PRODUCTS = "static:products";
const KEY_CATEGORIES = "static:categories";
const KEY_BANNERS = "static:banners";

const DataContext = createContext(undefined);

// ── fallback sample data (used when Firebase is unreachable) ──

const FALLBACK_CATEGORIES = [
  { id: "c1", name: "Men", slug: "men", image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { id: "c2", name: "Women", slug: "women", image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { id: "c3", name: "Accessories", slug: "accessories", image: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { id: "c4", name: "Shoes", slug: "shoes", image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { id: "c5", name: "Watches", slug: "watches", image: "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { id: "c6", name: "Bags", slug: "bags", image: "https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg?auto=compress&cs=tinysrgb&w=400" },
];

const FALLBACK_PRODUCTS = [
  { id: "p1", name: "Classic Denim Jacket", price: 3500, category: "Men", images: ["https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: true, isNewArrival: false, isLimitedOffer: false, description: "A timeless denim jacket perfect for any season." },
  { id: "p2", name: "Elegant Summer Dress", price: 4200, category: "Women", images: ["https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: true, isNewArrival: true, isLimitedOffer: false, description: "Light and breathable summer dress." },
  { id: "p3", name: "Premium Leather Wallet", price: 1800, category: "Accessories", images: ["https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: false, isNewArrival: true, isLimitedOffer: true, description: "Handcrafted genuine leather wallet." },
  { id: "p4", name: "Running Sneakers", price: 5500, category: "Shoes", images: ["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: true, isNewArrival: false, isLimitedOffer: false, description: "Comfortable and stylish running shoes." },
  { id: "p5", name: "Luxury Wrist Watch", price: 8500, category: "Watches", images: ["https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: false, isNewArrival: true, isLimitedOffer: false, description: "Elegant timepiece for every occasion." },
  { id: "p6", name: "Designer Handbag", price: 6200, category: "Bags", images: ["https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: true, isNewArrival: false, isLimitedOffer: false, description: "Spacious and stylish handbag." },
  { id: "p7", name: "Cotton Casual Shirt", price: 2500, category: "Men", images: ["https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: false, isNewArrival: true, isLimitedOffer: false, description: "Soft cotton shirt for everyday wear." },
  { id: "p8", name: "Silk Scarf", price: 1200, category: "Accessories", images: ["https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600"], isHot: false, isNewArrival: true, isLimitedOffer: false, description: "Luxurious silk scarf with elegant patterns." },
];

const FALLBACK_BANNERS = [
  { id: "b1", image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=1600", imageMobile: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "b2", image: "https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=1600", imageMobile: "https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=800" },
];

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

// Wrap a fetch promise so it falls back to fallbackData on any error or timeout
async function fetchWithFallback(fetchFn, fallbackData, timeoutMs = 5000) {
  try {
    const result = await Promise.race([
      fetchFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);
    return result;
  } catch (err) {
    console.warn("Fetch failed, using fallback data:", err);
    return fallbackData;
  }
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

    if (!needProducts && !needCategories && !needBanners) {
      setLoading(false);
      return;
    }

    fetchingRef.current = true;

    // Safety timeout: always stop loading after 6 seconds no matter what
    const safetyTimer = setTimeout(() => setLoading(false), 6000);

    // ── Phase 1: banners + categories (unblocks homepage render immediately) ──
    try {
      const [freshBanners, freshCategories] = await Promise.all([
        needBanners
          ? fetchWithFallback(fetchBanners, FALLBACK_BANNERS)
          : Promise.resolve(appCache.get(KEY_BANNERS) || FALLBACK_BANNERS),
        needCategories
          ? fetchWithFallback(fetchCategories, FALLBACK_CATEGORIES)
          : Promise.resolve(appCache.get(KEY_CATEGORIES) || FALLBACK_CATEGORIES),
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
      // Use fallback data so the page renders something
      if (!appCache.has(KEY_BANNERS) || (appCache.get(KEY_BANNERS) || []).length === 0) {
        setBanners(FALLBACK_BANNERS);
        setCategories(FALLBACK_CATEGORIES);
        setProducts(FALLBACK_PRODUCTS);
      }
      if (!appCache.has(KEY_BANNERS)) setOffline(true);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }

    // ── Phase 2: products in background (does not block rendering) ──
    if (needProducts) {
      try {
        const freshProducts = await fetchWithFallback(fetchProducts, FALLBACK_PRODUCTS);
        appCache.set(KEY_PRODUCTS, freshProducts, TTL.PRODUCTS);
        setProducts(freshProducts);
      } catch (err) {
        console.error(err);
        setProducts(FALLBACK_PRODUCTS);
      }
    }

    fetchingRef.current = false;
  };

  const refreshProducts = useCallback(async () => {
    appCache.invalidate(KEY_PRODUCTS);

    try {
      const fresh = await fetchWithFallback(fetchProducts, FALLBACK_PRODUCTS);
      appCache.set(KEY_PRODUCTS, fresh, TTL.PRODUCTS);
      setProducts(fresh);
    } catch (err) {
      console.error(err);
      setProducts(FALLBACK_PRODUCTS);
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