import { z } from "zod";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, hasFirebaseConfig } from "./firebase.js";

const ORDER_COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = "lastOrderAttemptAt";
const PHONE_PATTERN = /^[0-9+()\-\s]{10,20}$/;

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().max(254).pipe(z.email("Please enter a valid email address")),
  phone: z.string().trim().regex(PHONE_PATTERN, "Please enter a valid phone number"),
  address: z.string().trim().min(5, "Please enter your full address").max(300),
  city: z.string().trim().min(2, "Please enter your city").max(80),
  notes: z.string().trim().max(500).optional(),
});

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  color: z.string().nullable().optional(),
});

const cartSchema = z.array(cartItemSchema).min(1).max(30);

export class OrderError extends Error {}

function readCooldown() {
  try {
    return Number(sessionStorage.getItem(COOLDOWN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeCooldown() {
  try {
    sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {}
}

export function isOrderCooldownActive() {
  return Date.now() - readCooldown() < ORDER_COOLDOWN_MS;
}

export async function placeOrder({ customer, cartItems, shipping = 0 }) {
  if (!hasFirebaseConfig) {
    throw new OrderError("Orders are not available at this time.");
  }

  if (isOrderCooldownActive()) {
    throw new OrderError("Please wait a moment before placing another order.");
  }

  const parsedCustomer = customerSchema.safeParse(customer);
  if (!parsedCustomer.success) {
    throw new OrderError(parsedCustomer.error.issues[0]?.message || "Please check your details.");
  }

  const parsedCart = cartSchema.safeParse(cartItems);
  if (!parsedCart.success) {
    throw new OrderError("Your cart has invalid items. Please review it and try again.");
  }

  const lines = await Promise.all(
    parsedCart.data.map(async (line) => {
      const snap = await getDoc(doc(db, "products", line.productId));
      if (!snap.exists()) {
        throw new OrderError("Some items are no longer available. Please review your cart.");
      }
      const product = snap.data();
      const price = Number(product.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new OrderError("Some items have an invalid price. Please contact support.");
      }
      return {
        productId: line.productId,
        name: String(product.name ?? "").slice(0, 200),
        price,
        quantity: line.quantity,
        color: line.color ?? null,
      };
    })
  );

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const shippingCost = Number.isFinite(Number(shipping)) && Number(shipping) > 0 ? Number(shipping) : 0;
  const total = subtotal + shippingCost;

  const { name, email, phone, address, city, notes } = parsedCustomer.data;

  writeCooldown();

  const ref = await addDoc(collection(db, "orders"), {
    userId: auth.currentUser?.uid ?? null,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    customerAddress: address,
    customerCity: city,
    paymentMethod: "cod",
    ...(notes ? { notes } : {}),
    items: lines,
    total,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return {
    orderId: ref.id,
    shortId: ref.id.slice(0, 8).toUpperCase(),
    items: lines,
    subtotal,
    shipping: shippingCost,
    total,
    customer: { name, email, phone, address, city, notes: notes ?? null },
  };
}

export function notifyOrder(result) {
  const order = {
    orderId: result.orderId,
    shortId: result.shortId,
    name: result.customer.name,
    email: result.customer.email,
    phone: result.customer.phone,
    city: result.customer.city,
    address: result.customer.address,
    note: result.customer.notes,
    items: result.items,
    subtotal: result.subtotal,
    shipping: result.shipping,
    total: result.total,
    createdAt: new Date().toISOString(),
  };

  const post = (body) =>
    fetch("/api/send-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});

  post({ type: "order-placed", order });
  post({ type: "customer-order-placed", order, customerEmail: order.email });
}
