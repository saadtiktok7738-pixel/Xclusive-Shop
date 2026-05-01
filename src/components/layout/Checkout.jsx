import React, { useState } from "react";
import { Layout } from "../bonents/mainpage/Layout.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import { useShippingSettings } from "../hooks/useShippingSettings.js";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { useLocation } from "wouter";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { products } = useData();
  const { shippingCost, settings: shippingSettings } = useShippingSettings();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Name is ALWAYS empty — the user must type it in for every order, even when signed in.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  if (cart.length === 0) {
    setLocation("/");
    return null;
  }

  const orderTotal = cartTotal + shippingCost;

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      const items = cart
        .map((c) => {
          const p = products.find((x) => x.id === c.productId);
          if (!p) return null;
          return {
            productId: p.id,
            name: p.name,
            price: p.price,
            quantity: c.quantity,
            image: p.images?.[0] ?? null,
            color: c.color ?? null,
          };
        })
        .filter(Boolean);

      const order = {
        userId: user?.uid || "guest",
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        note: note.trim() || null,
        items,
        subtotal: cartTotal,
        shipping: shippingCost,
        total: orderTotal,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(collection(db, "orders"), order);
      const shortId = ref.id.slice(0, 8).toUpperCase();

      await updateDoc(doc(db, "orders", ref.id), {
        orderId: ref.id,
        shortId,
      });

      if (user) {
        await addDoc(
          collection(db, "users", user.uid, "orders"),
          { ...order, orderId: ref.id, shortId }
        );
      } else {
        try {
          const raw = localStorage.getItem("pendingGuestOrders");
          const list = raw ? JSON.parse(raw) : [];
          if (!list.includes(ref.id)) list.push(ref.id);
          localStorage.setItem(
            "pendingGuestOrders",
            JSON.stringify(list)
          );
        } catch {}
      }

      await clearCart();
      toast.success("Order placed successfully!");
      setLocation(`/thankyou?orderId=${ref.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to place order");
      setIsProcessing(false);
    }
  };

  return (
    <>
    <Helmet>
  {/* Prevent SEO indexing (IMPORTANT for checkout pages) */}
  <meta name="robots" content="noindex, nofollow" />

  <title>Checkout | Xclusive Shop</title>

  <meta
    name="description"
    content="Secure checkout at Xclusive Shop. Complete your order safely and quickly."
  />

  <meta name="keywords" content="checkout, Xclusive Shop, secure payment, order" />

  {/* Open Graph */}
  <meta property="og:title" content="Checkout | Xclusive Shop" />
  <meta
    property="og:description"
    content="Complete your purchase securely at Xclusive Shop checkout."
  />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Xclusive Shop" />

  {/* Twitter */}
  <meta name="twitter:title" content="Checkout | Xclusive Shop" />
  <meta
    name="twitter:description"
    content="Secure checkout for your Xclusive Shop order."
  />
</Helmet>
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-12 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">
            Shipping Details
          </h2>

          <form
            id="checkout-form"
            onSubmit={handleCheckout}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
                data-testid="input-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number *
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="e.g. 0300 1234567"
                data-testid="input-phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                City *
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="e.g. Karachi"
                data-testid="input-city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Complete Address *
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="House, Street, Area"
                data-testid="input-address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Order Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Any special instructions..."
                data-testid="input-note"
              />
            </div>

            <div className="p-4 bg-muted rounded-md mt-6">
              <span className="font-bold block mb-2">
                Payment Method
              </span>
              <div className="flex items-center gap-2 text-sm">
                <input type="radio" checked readOnly id="cod" />
                <label htmlFor="cod">Cash on Delivery (COD)</label>
              </div>
            </div>
          </form>
        </div>

        <div className="w-full md:w-1/2">
          <div className="bg-muted/50 p-6 md:p-8 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6 border-b border-border pb-2">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">
              {cart.map((item) => {
                const product = products.find(
                  (p) => p.id === item.productId
                );
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <span className="block font-medium line-clamp-1">
                          {product.name}
                        </span>
                        <span className="text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                        {item.color && (
                          <span className="text-muted-foreground block">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="font-bold">
                      Rs.{" "}
                      {(product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal
                </span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Shipping
                </span>

                {shippingSettings.type === "free" ? (
                  <span className="text-accent font-bold">FREE</span>
                ) : (
                  <span>
                    Rs. {shippingCost.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xl font-bold border-t border-border pt-4 mb-8">
              <span>Total</span>
              <span>Rs. {orderTotal.toLocaleString()}</span>
            </div>

            <Button
              type="submit"
              form="checkout-form"
              size="lg"
              className="w-full text-base md:text-lg h-11 md:h-14"
              disabled={isProcessing}
              data-testid="button-place-order"
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
    </>
  );
}