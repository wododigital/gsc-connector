"use client";
import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  planId: string;
  plan: { displayName: string };
  durationMonths: number;
  maxRedemptions: number;
  timesRedeemed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { redemptions: number };
}

const PLANS = [
  { id: "plan_free", label: "Free" },
  { id: "plan_pro", label: "Pro" },
  { id: "plan_premium", label: "Premium" },
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    planId: "plan_pro",
    durationMonths: "1",
    maxRedemptions: "100",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchCoupons = () => {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d) => { setCoupons(d.coupons ?? []); setLoading(false); });
  };

  useEffect(() => { fetchCoupons(); }, []);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create coupon");
    } else {
      setForm({ code: "", planId: "plan_pro", durationMonths: "1", maxRedemptions: "100" });
      fetchCoupons();
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Coupons</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Create Coupon</h2>
        <form onSubmit={createCoupon} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Plan</label>
            <select
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Duration (months)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Max Redemptions</label>
            <input
              type="number"
              min="1"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            />
          </div>
          {error && <p className="col-span-full text-red-400 text-sm">{error}</p>}
          <div className="col-span-full">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Code", "Plan", "Duration", "Used / Max", "Expires", "Status", "Created"].map((h) => (
                <th key={h} className="text-left text-xs text-zinc-500 uppercase px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-zinc-500 py-8">Loading...</td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3 font-mono text-white font-medium">{c.code}</td>
                <td className="px-4 py-3 text-zinc-300">{c.plan?.displayName ?? c.planId}</td>
                <td className="px-4 py-3 text-zinc-400">{c.durationMonths}mo</td>
                <td className="px-4 py-3 text-zinc-400">{c._count?.redemptions ?? c.timesRedeemed} / {c.maxRedemptions}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.isActive ? "bg-green-900/50 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
