import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { toast } from "sonner";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { products } = useData();

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  // Guest cart load
  useEffect(() => {
    if (!user) {
      const localCart = localStorage.getItem("cart");
      const localWishlist = localStorage.getItem("wishlist");

      if (localCart) setCart(JSON.parse(localCart));
      if (localWishlist) setWishlist(JSON.parse(localWishlist));
    }
  }, [user]);

  // Load Firestore data when user logs in
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;

      try {
        // CART
        const cartSnapshot = await getDocs(
          collection(db, "users", user.uid, "cart")
        );

        const firestoreCart = cartSnapshot.docs.map((d) => ({
          productId: d.id,
          ...d.data(),
        }));

        const localCartStr = localStorage.getItem("cart");

        if (localCartStr) {
          const localCart = JSON.parse(localCartStr);

          for (const item of localCart) {
            const exists = firestoreCart.find(
              (c) => c.productId === item.productId
            );

            if (!exists) {
              await setDoc(
                doc(db, "users", user.uid, "cart", item.productId),
                {
                  quantity: item.quantity,
                  addedAt: item.addedAt,
                  color: item.color ?? null,
                }
              );

              firestoreCart.push(item);
            }
          }

          localStorage.removeItem("cart");
        }

        setCart(firestoreCart);

        // WISHLIST
        const wishlistSnapshot = await getDocs(
          collection(db, "users", user.uid, "wishlist")
        );

        const firestoreWishlist = wishlistSnapshot.docs.map((d) => d.id);

        const localWishlistStr = localStorage.getItem("wishlist");

        if (localWishlistStr) {
          const localWishlist = JSON.parse(localWishlistStr);

          for (const id of localWishlist) {
            if (!firestoreWishlist.includes(id)) {
              await setDoc(
                doc(db, "users", user.uid, "wishlist", id),
                {
                  addedAt: new Date().toISOString(),
                }
              );

              firestoreWishlist.push(id);
            }
          }

          localStorage.removeItem("wishlist");
        }

        setWishlist(firestoreWishlist);
      } catch (error) {
        console.error("Error loading user data", error);
      }
    }

    loadUserData();
  }, [user]);

  // Save guest data
  useEffect(() => {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(cart));
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [cart, wishlist, user]);

  // CART TOTAL
  useEffect(() => {
    let total = 0;

    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    });

    setCartTotal(total);
  }, [cart, products]);

  // ADD TO CART
  const addToCart = async (productId, quantity = 1, color) => {
    const index = cart.findIndex((i) => i.productId === productId);
    let newCart = [...cart];

    if (index >= 0) {
      newCart[index] = {
        ...newCart[index],
        quantity: newCart[index].quantity + quantity,
        ...(color !== undefined ? { color } : {}),
      };
    } else {
      newCart.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
        color: color ?? null,
      });
    }

    setCart(newCart);
    setIsCartOpen(true);
    toast.success("Added to cart");

    if (user) {
      const ref = doc(db, "users", user.uid, "cart", productId);

      if (index >= 0) {
        await updateDoc(ref, {
          quantity: newCart[index].quantity,
          ...(color !== undefined ? { color } : {}),
        });
      } else {
        await setDoc(ref, {
          quantity,
          addedAt: new Date().toISOString(),
          color: color ?? null,
        });
      }
    }
  };

  // REMOVE
  const removeFromCart = async (productId) => {
    setCart(cart.filter((i) => i.productId !== productId));

    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "cart", productId));
      } catch {}
    }
  };

  // UPDATE QUANTITY
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    setCart(
      cart.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );

    if (user) {
      await updateDoc(doc(db, "users", user.uid, "cart", productId), {
        quantity,
      });
    }
  };

  // CLEAR CART
  const clearCart = async () => {
    const items = [...cart];
    setCart([]);

    if (user) {
      await Promise.all(
        items.map((it) =>
          deleteDoc(
            doc(db, "users", user.uid, "cart", it.productId)
          ).catch(() => null)
        )
      );
    }
  };

  // WISHLIST
  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.error("Please sign in to save to wishlist");
      return;
    }

    const exists = wishlist.includes(productId);
    let newList;

    if (exists) {
      newList = wishlist.filter((id) => id !== productId);
      try {
        await deleteDoc(
          doc(db, "users", user.uid, "wishlist", productId)
        );
      } catch {}
    } else {
      newList = [...wishlist, productId];
      await setDoc(
        doc(db, "users", user.uid, "wishlist", productId),
        {
          addedAt: new Date().toISOString(),
        }
      );
      toast.success("Added to wishlist");
    }

    setWishlist(newList);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isCartOpen,
        setIsCartOpen,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}