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
          <p className="text-sm text-neutral-500">
            {orders.length} orders total
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <FilterBtn
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {STATUSES.map((s) => (
            <FilterBtn
              key={s}
              label={s}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>
      </div>

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
                    <button onClick={() => toggle(o.id)}>
                      {open ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="min-w-[120px] flex-1">
                      <p className="text-xs font-mono font-bold">
                        #{shortId}
                      </p>
                      <p className="text-sm">{o.name}</p>
                    </div>

                    <div className="text-sm font-bold">
                      Rs. {o.total.toLocaleString()}
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_COLORS[o.status]
                      }`}
                    >
                      {o.status}
                    </span>

                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateStatus(o.id, e.target.value, o.userId)
                      }
                      className="border px-3 py-2 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button onClick={() => openTracking(o)}>
                      <Truck className="h-3 w-3" />
                    </button>

                    <button onClick={() => remove(o.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {open && (
                    <div className="border-t bg-neutral-50 p-4">
                      <p>
                        <strong>Name:</strong> {o.name}
                      </p>
                      <p>
                        <strong>Phone:</strong> {o.phone}
                      </p>
                      <p>
                        <strong>City:</strong> {o.city}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={!!trackingOrder}
        onOpenChange={(o) => !o && setTrackingOrder(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tracking</DialogTitle>
          </DialogHeader>

          <form onSubmit={saveTracking}>
            <Input
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="Courier"
            />
            <Input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Tracking ID"
            />

            <DialogFooter>
              <Button type="submit">
                {savingTracking ? "Saving..." : "Save"}
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
      className={`px-3 py-1.5 text-xs ${
        active ? "bg-black text-white" : "border"
      }`}
    >
      {label}
    </button>
  );
}