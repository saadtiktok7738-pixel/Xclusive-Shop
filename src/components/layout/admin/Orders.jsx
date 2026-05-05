import { useEffect, useState } from "react";
import { db } from "../../lib/firebase.js";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Truck,
  Pencil,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog.jsx";
import { Input } from "../../ui/input.jsx";
import { Button } from "../../ui/button.jsx";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [trackingOrder, setTrackingOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
      setOrders(list);
    });
    return () => unsub();
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const visible = search.trim()
    ? filtered.filter((o) => {
        const q = search.trim().toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          (o.name || "").toLowerCase().includes(q)
        );
      })
    : filtered;

  const toggle = (id) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  const updateStatus = async (id, status, userId) => {
    try {
      const update = {
        status,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "orders", id), update);
      toast.success(`Status updated to ${status}`);

      // Send customer email for meaningful status changes
      const notifyStatuses = ["processing", "shipped", "delivered", "cancelled"];
      if (notifyStatuses.includes(status)) {
        const order = orders.find((o) => o.id === id);
        if (order && order.email) {
          const updatedOrder = { ...order, status };
          fetch("/api/send-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "status-update",
              order: updatedOrder,
              customerEmail: order.email,
            }),
          }).catch(() => {});
        }
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const doRemove = async (id) => {
    try {
      await deleteDoc(doc(db, "orders", id));
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const remove = (id) => {
    toast("Delete this order permanently?", {
      action: { label: "Delete", onClick: () => void doRemove(id) },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 6000,
    });
  };

  const openTracking = (o) => {
    setTrackingOrder(o);
    setCourier(o.courier || "");
    setTrackingId(o.trackingId || "");
  };

  const saveTracking = async (e) => {
    e.preventDefault();
    if (!trackingOrder) return;

    if (!courier.trim() || !trackingId.trim()) {
      toast.error("Please enter courier and tracking ID");
      return;
    }

    setSavingTracking(true);
    try {
      const update = {
        courier: courier.trim(),
        trackingId: trackingId.trim(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "orders", trackingOrder.id), update);
      toast.success("Tracking saved");

      // Send tracking email to customer
      if (trackingOrder.email) {
        const updatedOrder = {
          ...trackingOrder,
          courier: courier.trim(),
          trackingId: trackingId.trim(),
        };
        fetch("/api/send-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "tracking-added",
            order: updatedOrder,
            customerEmail: trackingOrder.email,
          }),
        }).catch(() => {});
      }

      setTrackingOrder(null);
    } catch {
      toast.error("Failed to save tracking");
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className="space-y-5">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-neutral-500">{orders.length} orders total</p>
    </div>
    <div className="flex flex-wrap gap-1">
      <FilterBtn label="All" active={filter === "all"} onClick={() => setFilter("all")} />
      {STATUSES.map((s) => (
        <FilterBtn key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
      ))}
    </div>
  </div>

  {/* Search Bar */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search by Order ID or Customer Name..."
      className="w-full border border-neutral-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
    />
  </div>

  <div className="rounded-2xl border border-neutral-200 bg-white">
    {visible.length === 0 ? (
      <p className="p-10 text-center text-sm text-neutral-500">
        {search ? "No orders match your search." : "No orders found."}
      </p>
    ) : (
      <ul className="divide-y divide-neutral-200">
        {visible.map((o) => {
          const open = expanded.has(o.id);
          const hasTracking = !!(o.courier && o.trackingId);
          const shortId = o.id.slice(0, 8).toUpperCase();

          return (
            <li key={o.id}>
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  onClick={() => toggle(o.id)}
                  className="rounded-md p-1 hover:bg-neutral-100"
                  data-testid={`button-toggle-order-${o.id}`}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Order ID (top) + Customer Name (below) */}
                <div className="min-w-[120px] flex-1">
                  <p className="text-xs font-mono font-bold text-neutral-800">
                    #{shortId}
                  </p>
                  <p className="text-sm text-neutral-600">{o.name}</p>
                </div>

                <div className="hidden text-xs text-neutral-500 md:block">
                  {format(new Date(o.createdAt), "MMM d, yyyy h:mm a")}
                </div>

                <div className="text-sm font-bold">
                  Rs. {o.total.toLocaleString()}
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[o.status]}`}
                >
                  {o.status}
                </span>

                <select
                  value={o.status}
                  onChange={(e) =>
                    updateStatus(o.id, e.target.value, o.userId)
                  }
                  className="min-w-[140px] border border-neutral-300 bg-white px-3 py-2 text-xs font-medium capitalize text-neutral-800 cursor-pointer focus:outline-none focus:border-neutral-900"
                  data-testid={`select-status-${o.id}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => openTracking(o)}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    hasTracking
                      ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  data-testid={`button-set-tracking-${o.id}`}
                  title={hasTracking ? "Edit tracking" : "Set tracking"}
                >
                  {hasTracking ? (
                    <Pencil className="h-3 w-3" />
                  ) : (
                    <Truck className="h-3 w-3" />
                  )}
                  {hasTracking ? "Edit Tracking" : "Set Tracking"}
                </button>

                <button
                  onClick={() => remove(o.id)}
                  className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  data-testid={`button-delete-${o.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {open && (
                <div className="border-t border-neutral-200 bg-neutral-50 p-4">
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
                        Shipping
                      </h3>
                      <p>
                        <strong>Order ID:</strong>{" "}
                        <span className="font-mono font-bold">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      <p>
                        <strong>Name:</strong> {o.name}
                      </p>
                      {o.email && (
                        <p>
                          <strong>Email:</strong> {o.email}
                        </p>
                      )}
                      <p>
                        <strong>Phone:</strong> {o.phone}
                      </p>
                      <p>
                        <strong>City:</strong> {o.city}
                      </p>
                      <p>
                        <strong>Address:</strong> {o.address}
                      </p>

                      {o.note && (
                        <p>
                          <strong>Note:</strong> {o.note}
                        </p>
                      )}

                      {hasTracking && (
                        <div className="mt-2 border-t border-neutral-200 pt-2">
                          <p>
                            <strong>Courier:</strong> {o.courier}
                          </p>
                          <p>
                            <strong>Tracking ID:</strong> {o.trackingId}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
                        Items (
                        {o.items.reduce((s, i) => s + i.quantity, 0)})
                      </h3>

                      <ul className="space-y-2">
                        {o.items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-3 rounded-md bg-white p-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt=""
                                  className="h-10 w-10 flex-shrink-0 rounded object-cover"
                                />
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {it.name}
                                </p>
                                <p className="text-[11px] text-neutral-500">
                                  Qty: {it.quantity}
                                </p>
                                {it.color && (
                                  <p className="text-[11px] text-neutral-500">
                                    Color: {it.color}
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-semibold whitespace-nowrap">
                              Rs. {(it.price * it.quantity).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 border-t border-neutral-200 pt-2 space-y-1 text-xs text-neutral-500">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>
                            Rs. {(o.subtotal ?? o.total).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Shipping</span>
                          {(o.shipping ?? 0) === 0 ? (
                            <span className="font-semibold text-green-600">
                              Free
                            </span>
                          ) : (
                            <span>
                              Rs. {(o.shipping ?? 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-sm font-bold">
                        <span>Total</span>
                        <span>Rs. {o.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>

  {/* Tracking Modal */}
  <Dialog
    open={!!trackingOrder}
    onOpenChange={(o) => !o && setTrackingOrder(null)}
  >
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-base font-bold uppercase tracking-wide">
          {trackingOrder?.courier ? "Edit Tracking" : "Set Tracking"}
        </DialogTitle>

        {trackingOrder && (
          <p className="text-xs text-muted-foreground">
            Order #{trackingOrder.id.slice(0, 8).toUpperCase()} ·{" "}
            {trackingOrder.name}
          </p>
        )}
      </DialogHeader>

      <form onSubmit={saveTracking} className="space-y-3 mt-2">
        <div>
          <label className="block text-xs font-medium mb-1">
            Courier Company *
          </label>
          <Input
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="e.g. TCS, Leopards, M&P"
            required
            data-testid="input-tracking-courier"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">
            Tracking ID *
          </label>
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="e.g. 123456789"
            required
            data-testid="input-tracking-id"
          />
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="submit"
            className="w-full h-11"
            disabled={savingTracking}
            data-testid="button-save-tracking"
          >
            {savingTracking ? "Saving..." : "Save Tracking"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</div>
);
}
function FilterBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs capitalize ${
        active
          ? "bg-black text-white"
          : "border border-neutral-300 bg-white text-neutral-700 hover-elevate active-elevate-2"
      }`}
      data-testid={`filter-${label.toLowerCase()}`}
    >
      {label}
    </button>
  );
}