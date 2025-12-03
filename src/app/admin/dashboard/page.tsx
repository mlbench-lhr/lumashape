"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import SimpleBarChart from "@/components/ui/barChart";

type Monthly = { label: string; revenue: number; kaiser: number; lumashape: number; orders: number; year: number; month: number; key: string };
type StripeMetrics = { totalTransactions: number; feesCents: number; refundsCents: number };
type UserItem = { username?: string; email?: string; avatar?: string; profilePic?: string };

type DashboardData = {
  summary: { label: string; revenue: number; kaiser: number; lumashape: number; orders: number; growth: number };
  monthlyRevenue: Monthly[];
  stripeMetrics: StripeMetrics;
  latestUsers: UserItem[];
  userInsights: { monthly: { label: string; count: number }[]; growth: number };
};

const currency0 = (n: number) => `$${Math.round(n).toLocaleString()}`;
const currency2 = (n: number) => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  const w = 80, h = 32;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bars({ items }: { items: { key: string; short: string; value: number }[] }) {
  // Calculate dynamic max value rounded up to nearest 10k
  const maxValue = Math.max(...items.map(i => i.value), 1);
  const max = Math.ceil(maxValue / 10000) * 10000;

  // Generate grid lines dynamically
  const gridCount = 6;
  const gridLines = Array.from({ length: gridCount }, (_, i) =>
    Math.round((max / (gridCount - 1)) * i)
  ).reverse();

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-400 w-12">
        {gridLines.map(val => (
          <span key={val}>${(val / 1000).toFixed(0)}k</span>
        ))}
      </div>

      {/* Chart area */}
      <div className="ml-12 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: '200px' }}>
          {gridLines.map((line, idx) => (
            <div key={line} className="border-t border-dashed border-gray-200" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative flex items-end justify-between gap-3 px-2" style={{ height: '200px' }}>
          {items.map(i => {
            const heightPercent = Math.max(2, (i.value / max) * 100);
            return (
              <div key={i.key} className="flex flex-col justify-end items-center flex-1">
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    backgroundColor: i.short === "This Month" ? "#60a5fa" : "#3b82f6",
                    height: `${heightPercent}%`,
                    maxWidth: "40px",
                    minHeight: "8px"
                  }}
                />
                <span className="mt-2 text-xs text-gray-500 font-medium whitespace-nowrap">{i.short}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [ddOpen, setDdOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : null;
        const res = await fetch("/api/admin/dashboard", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load dashboard");
        setData(json as DashboardData);
        const last = (json.monthlyRevenue || []).slice(-1)[0];
        setMonthKey(last?.key || null);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const selected = useMemo(() => {
    if (!data || !monthKey) return null;
    return data.monthlyRevenue.find(m => m.key === monthKey) || data.monthlyRevenue.slice(-1)[0] || null;
  }, [data, monthKey]);

  const prevValue = (get: (m: Monthly) => number) => {
    if (!data || !selected) return 0;
    const idx = data.monthlyRevenue.findIndex(m => m.key === selected.key);
    const prev = idx > 0 ? data.monthlyRevenue[idx - 1] : undefined;
    return prev ? get(prev) : 0;
  };

  const growthOf = (cur: number, prev: number): number | null => {
    if (prev <= 0) return null;
    return (cur - prev) / prev;
  };

  const revenueGrowth = growthOf(selected?.revenue || 0, prevValue(m => m.revenue));
  const kaiserGrowth = growthOf(selected?.kaiser || 0, prevValue(m => m.kaiser));
  const lumaGrowth = growthOf(selected?.lumashape || 0, prevValue(m => m.lumashape));

  const monthsShort = (data?.monthlyRevenue || []).map((m) => {
    const label = m.label;
    if (label === "This Month") return { key: m.key, short: "This Month" };
    return { key: m.key, short: label.replace(/\s\d{4}/, "") };
  });
  const chartData = (data?.monthlyRevenue || []).map((m, i) => ({ date: `${m.year}-${m.month}`, name: monthsShort[i]?.short || m.label, value: Math.round(m.revenue) }));
  const sparkRevenue = (data?.monthlyRevenue || []).map(m => m.revenue);
  const sparkKaiser = (data?.monthlyRevenue || []).map(m => m.kaiser);
  const sparkLuma = (data?.monthlyRevenue || []).map(m => m.lumashape);
  const userSpark = (data?.userInsights.monthly || []).map(u => u.count);

  if (loading) return <div className="min-h-screen bg-white p-8 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;
  if (error) return <div className="min-h-screen bg-white p-8"><div className="text-red-600">{error}</div></div>;
  if (!data || !selected) return <div className="min-h-screen bg-white p-8"><div className="text-gray-500">No data</div></div>;

  const MonthDropdown = (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
        onClick={() => setDdOpen(v => !v)}
      >
        {selected.label}
        <ChevronDown className="w-4 h-4" />
      </button>
      {ddOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDdOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 bg-white border border-gray-200 rounded-lg shadow-lg text-sm min-w-[140px]">
            {(data.monthlyRevenue || []).map(m => (
              <button
                key={m.key}
                className="px-4 py-2.5 w-full text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg font-medium text-gray-700"
                onClick={() => { setMonthKey(m.key); setDdOpen(false); }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const MetricCard = ({
    title,
    amount,
    growth,
    icon,
    iconBg,
    series
  }: {
    title: string;
    amount: number;
    growth: number | null;
    icon: React.ReactNode;
    iconBg: string;
    series: number[];
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-gray-700 font-medium text-sm">{title}</span>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900">{currency0(amount)}</div>
        <div className="text-xs text-gray-500 mt-1">This Month</div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Sparkline data={series.slice(-6)} color={growth === null ? "#64748b" : growth >= 0 ? "#3b82f6" : "#ef4444"} />
        <div className={`flex items-center gap-1 text-sm font-semibold ${growth === null ? "text-gray-500" : growth >= 0 ? "text-green-600" : "text-red-600"}`}>
          {growth === null ? (
            <span>—</span>
          ) : (
            <>
              {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{pct(Math.abs(growth))}</span>
              {growth < 0 ? "▼" : "▲"}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {MonthDropdown}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          amount={selected.revenue}
          growth={revenueGrowth}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-blue-50"
          series={sparkRevenue}
        />
        <MetricCard
          title="Kaiser Mfg. Payout"
          amount={selected.kaiser}
          growth={kaiserGrowth}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-blue-50"
          series={sparkKaiser}
        />
        <MetricCard
          title="Lumashape Payout"
          amount={selected.lumashape}
          growth={lumaGrowth}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          iconBg="bg-blue-50"
          series={sparkLuma}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Monthly Revenue</h2>
            <SimpleBarChart data={chartData} isLoading={false} formatYAxisLabel={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : `${Math.round(v)}` } />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">User & Activity Insights</h2>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#fda29b", stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: "#fda29b", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                {(() => {
                  const u = userSpark;
                  const w = 800;
                  const h = 200;
                  const niceMax = (val: number) => {
                    if (val <= 0) return 10;
                    const p = Math.pow(10, Math.floor(Math.log10(val)));
                    const f = val / p;
                    const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
                    return nf * p;
                  };
                  const maxValue = niceMax(Math.max(...u, 0));
                  const step = u.length > 1 ? w / (u.length - 1) : w;
                  const points = u.map((v, i) => `${i * step},${h - (v / maxValue) * h}`).join(" ");
                  const areaPoints = `0,${h} ${points} ${w},${h}`;
                  const gridYs = [0.25, 0.5, 0.75, 1].map(fr => h - fr * h);
                  return (
                    <>
                      {gridYs.map((y, idx) => (
                        <line key={idx} x1={0} x2={w} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
                      ))}
                      <polygon points={areaPoints} fill="url(#areaGradient)" />
                      <polyline points={points} fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex justify-between px-2 pt-2 text-xs text-gray-500">
              {(data.userInsights.monthly || []).map((m, i) => (
                <span key={i}>{m.label.replace(/\s\d{4}/, "")}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-600">Total Orders</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-4">{selected.orders}</div>
              <div className="flex items-center justify-between">
                <Sparkline data={(data.monthlyRevenue || []).map(m => m.orders).slice(-6)} />
                {(() => {
                  const g = growthOf(selected.orders, prevValue(m => m.orders));
                  const isNull = g === null;
                  const isUp = !isNull && (g as number) >= 0;
                  return (
                    <div className={`text-sm font-semibold ${isNull ? "text-gray-500" : isUp ? "text-green-600" : "text-red-600"}`}>
                      {isNull ? "—" : pct(Math.abs(g as number))}
                      {!isNull && (isUp ? " ▲" : " ▼")}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Stripe Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Transactions:</span>
                <span className="font-semibold text-gray-900">{data.stripeMetrics.totalTransactions.toLocaleString()} (-5.5%M/M)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stripe Fees</span>
                <span className="font-semibold text-gray-900">{currency2((data.stripeMetrics.feesCents || 0) / 100)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Refunds</span>
                <span className="font-semibold text-gray-900">{currency2((data.stripeMetrics.refundsCents || 0) / 100)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Latest Added Users</h3>
            <div className="space-y-3 h-full overflow-y-auto">
              {data.latestUsers.map((u, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
                    {u.profilePic || u.avatar ? (
                      <img src={(u.profilePic || u.avatar) as string} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                        {(u.username || u.email || "").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{u.username || u.email}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}