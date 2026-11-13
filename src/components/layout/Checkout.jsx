import React, { useState, useEffect } from "react";
import { Layout } from "../bonents/mainpage/Layout.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import { useShippingSettings } from "../hooks/useShippingSettings.js";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import { useLocation } from "wouter";
import { placeOrder, notifyOrder, OrderError } from "../lib/orderService.js";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { products } = useData();
  const { shippingCost, settings: shippingSettings } = useShippingSettings();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");

  // Auto-fill email from logged-in user
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user]);

  if (cart.length === 0) {
    setLocation("/");
    return null;
  }

  const orderTotal = cartTotal + shippingCost;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (isProcessing || website) return;

    setIsProcessing(true);

    try {
      const result = await placeOrder({
        customer: { name, email, phone, address, city, notes: note },
        cartItems: cart,
        shipping: shippingCost,
      });

      notifyOrder(result);
      clearCart();
      toast.success("Order placed successfully!");
      setLocation(`/thankyou?orderId=${result.orderId}`);
    } catch (error) {
      toast.error(error instanceof OrderError ? error.message : "Failed to place order");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Checkout | Xclusive Shop</title>
        <meta name="description" content="Secure checkout at Xclusive Shop. Complete your order safely and quickly." />
        <meta name="keywords" content="checkout, Xclusive Shop, secure payment, order" />
        <meta property="og:title" content="Checkout | Xclusive Shop" />
        <meta property="og:description" content="Complete your purchase securely at Xclusive Shop checkout." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Xclusive Shop" />
        <meta name="twitter:title" content="Checkout | Xclusive Shop" />
        <meta name="twitter:description" content="Secure checkout for your Xclusive Shop order." />
      </Helmet>

      <Layout>
        <div className="container mx-auto px-4 py-6 md:py-12 flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2">
            <form
              id="checkout-form"
              onSubmit={handleCheckout}
              className="space-y-6"
            >
              {/* ── Contact Section ── */}
              <div>
                <h2 className="text-xl font-bold mb-1">Contact</h2>
                

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. you@example.com"
                    data-testid="input-email"
                  />
                </div>
              </div>

              {/* ── Shipping Information Section ── */}
              <div>
                <h2 className="text-xl font-bold mb-1 pt-2 border-t border-border">
                  Shipping Information
                </h2>
                

                <div className="space-y-4">
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
                </div>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <span className="font-bold block mb-2">Payment Method</span>
                <div className="flex items-center gap-2 text-sm">
                  <input type="radio" checked readOnly id="cod" />
                  <label htmlFor="cod">Cash on Delivery (COD)</label>
                </div>
              </div>

              <div className="hidden" aria-hidden="true">
                <label>
                  Leave this field empty
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
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
                  const product = products.find((p) => p.id === item.productId);
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
                        Rs. {(product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rs. {cartTotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  {shippingSettings.type === "free" ? (
                    <span className="text-accent font-bold">FREE</span>
                  ) : (
                    <span>Rs. {shippingCost.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
    (Free delivery charges on advance payment)
  </p>
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
