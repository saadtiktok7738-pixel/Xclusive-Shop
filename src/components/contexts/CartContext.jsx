import React, { createContext, useContext, useEffect, useState } from "react";
import { useData } from "./DataContext";
import { toast } from "sonner";

const CartContext = createContext(undefined);

const MAX_QUANTITY = 20;

function readStoredList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeCartItem(item) {
  if (!item || typeof item.productId !== "string" || !item.productId) return null;
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
  return {
    productId: item.productId,
    quantity,
    addedAt: typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString(),
    color: typeof item.color === "string" ? item.color : null,
  };
}

export function CartProvider({ children }) {
  const { products } = useData();

  const [cart, setCart] = useState(() =>
    readStoredList("cart").map(sanitizeCartItem).filter(Boolean)
  );
  const [wishlist, setWishlist] = useState(() =>
    readStoredList("wishlist").filter((id) => typeof id === "string")
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? total + product.price * item.quantity : total;
  }, 0);

  const addToCart = (productId, quantity = 1, color) => {
    setCart((prev) => {
      const index = prev.findIndex((i) => i.productId === productId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = {
          ...next[index],
          quantity: Math.min(MAX_QUANTITY, next[index].quantity + quantity),
          ...(color !== undefined ? { color } : {}),
        };
        return next;
      }
      return [
        ...prev,
        {
          productId,
          quantity: Math.min(MAX_QUANTITY, quantity),
          addedAt: new Date().toISOString(),
          color: color ?? null,
        },
      ];
    });
    setIsCartOpen(true);
    toast.success("Added to cart");
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return;
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId) => {
    const exists = wishlist.includes(productId);
    setWishlist((prev) =>
      exists ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    if (!exists) toast.success("Added to wishlist");
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
