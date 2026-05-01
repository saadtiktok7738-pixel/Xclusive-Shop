import { useEffect, useMemo, useState } from "react";
import { db } from "../../lib/firebase.js";
import { collection, onSnapshot } from "firebase/firestore";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Legend,
} from "recharts";
import {
  format,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  subDays,
  parseISO,
} from "date-fns";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  Activity,
} from "lucide-react";

const ACTIVE_WINDOW_MS = 60000;

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [presence, setPresence] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [from, setFrom] = useState(
    format(subDays(new Date(), 29), "yyyy-MM-dd")
  );
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "presence"), (snap) => {
      setPresence(
        snap.docs.map((d) => {
          const data = d.data();
          const ts =
            typeof data.lastSeen === "string"
              ? new Date(data.lastSeen).getTime()
              : 0;

          return { id: d.id, lastSeen: ts };
        })
      );
    });

    const tick = setInterval(() => setNow(Date.now()), 10000);

    return () => {
      unsub();
      clearInterval(tick);
    };
  }, []);

  const liveVisitors = useMemo(
    () =>
      presence.filter((p) => now - p.lastSeen < ACTIVE_WINDOW_MS).length,
    [presence, now]
  );

  const fromDate = useMemo(() => startOfDay(parseISO(from)), [from]);
  const toDate = useMemo(() => endOfDay(parseISO(to)), [to]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return (
          t >= fromDate.getTime() &&
          t <= toDate.getTime() &&
          o.status !== "cancelled"
        );
      }),
    [orders, fromDate, toDate]
  );

  const series = useMemo(() => {
    if (toDate < fromDate) return [];

    const days = eachDayOfInterval({ start: fromDate, end: toDate });

    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");

      const dayOrders = filtered.filter(
        (o) =>
          format(new Date(o.createdAt), "yyyy-MM-dd") === key
      );

      return {
        date: format(d, "MMM d"),
        sales: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      };
    });
  }, [filtered, fromDate, toDate]);

  const totals = useMemo(() => {
    const sales = filtered.reduce(
      (s, o) => s + (o.total || 0),
      0
    );

    const count = filtered.length;

    const avg = count > 0 ? sales / count : 0;

    const items = filtered.reduce(
      (s, o) =>
        s +
        o.items.reduce((x, i) => x + i.quantity, 0),
      0
    );

    return { sales, count, avg, items };
  }, [filtered]);

  const setRange = (days) => {
    setFrom(
      format(subDays(new Date(), days - 1), "yyyy-MM-dd")
    );
    setTo(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Live stats bar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>

          <Activity className="h-4 w-4 text-neutral-700" />

          <span className="text-xs md:text-sm font-semibold text-neutral-800">
            Live Visitors:{" "}
            <span className="text-green-600">
              {liveVisitors}
            </span>
          </span>
        </div>

        <span className="hidden sm:inline text-[10px] md:text-[11px] text-neutral-500">
          Active in the last 60s
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Sales & order trends for the selected range.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className="text-[10px] md:text-[11px] uppercase tracking-wider text-neutral-500">
              From
            </label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[120px] border border-neutral-300 bg-white px-2 py-1 text-[11px] md:px-3 md:py-2 md:text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] md:text-[11px] uppercase tracking-wider text-neutral-500">
              To
            </label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="w-[120px] border border-neutral-300 bg-white px-2 py-1 text-[11px] md:px-3 md:py-2 md:text-sm"
            />
          </div>

          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className="border border-neutral-300 bg-white px-2 py-1 text-[11px] md:px-3 md:py-2 md:text-xs"
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Sales"
          value={`Rs. ${totals.sales.toLocaleString()}`}
        />
        <KpiCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Orders"
          value={totals.count.toString()}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg. Order"
          value={`Rs. ${Math.round(
            totals.avg
          ).toLocaleString()}`}
        />
        <KpiCard
          icon={<Package className="h-4 w-4" />}
          label="Items Sold"
          value={totals.items.toString()}
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 md:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs md:text-sm font-semibold">
            Sales & Orders over time
          </h2>
        </div>

        <div className="h-60 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="orders"
                fill="#000"
              />
              <Line
                yAxisId="left"
                dataKey="sales"
                stroke="#56ab2f"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 md:p-4">
      <div className="flex items-center justify-between text-neutral-500">
        <span className="text-[10px] uppercase">
          {label}
        </span>
        <span>{icon}</span>
      </div>
      <p className="mt-2 text-sm md:text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}