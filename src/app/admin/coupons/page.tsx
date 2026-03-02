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
      <h1 className="page-title">Coupons</h1>

      {/* Create form */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Create Coupon
        </h2>
        <form onSubmit={createCoupon} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
              required
              className="glass-input text-sm uppercase"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Plan</label>
            <select
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="glass-select text-sm"
            >
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Duration (months)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
              className="glass-input text-sm"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>Max Redemptions</label>
            <input
              type="number"
              min="1"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              className="glass-input text-sm"
            />
          </div>
          {error && (
            <p className="col-span-full text-sm" style={{ color: "var(--error)" }}>{error}</p>
          )}
          <div className="col-span-full">
            <button type="submit" disabled={creating} className="btn-primary btn-primary-sm">
              {creating ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>

      {/* Coupon table */}
      <div className="glass-panel overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              {["Code", "Plan", "Duration", "Used / Max", "Expires", "Status", "Created"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Loading...
                </td>
              </tr>
            ) : coupons.map((c) => (
              <tr key={c.id}>
                <td className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
                  {c.code}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{c.plan?.displayName ?? c.planId}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.durationMonths}mo</td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {c._count?.redemptions ?? c.timesRedeemed} / {c.maxRedemptions}
                </td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td>
                  <span className={`badge ${c.isActive ? "badge-success" : "badge-muted"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
