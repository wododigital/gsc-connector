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
  { id: "plan_annual", label: "Annual" },
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    planId: "plan_annual",
    durationMonths: "1",
    maxRedemptions: "100",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchCoupons = () => {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d) => {
        setCoupons(d.coupons ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

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
      setForm({ code: "", planId: "plan_annual", durationMonths: "1", maxRedemptions: "100" });
      fetchCoupons();
    }
    setCreating(false);
  };

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedeemed = coupons.reduce(
    (acc, c) => acc + (c._count?.redemptions ?? c.timesRedeemed),
    0,
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            Promo <span className="accent">codes.</span>
          </h1>
          <p className="lede">
            Issue plan unlocks for partners, podcasts, and beta cohorts. Each code is single use per
            account; redemptions are auditable.
          </p>
        </div>
      </div>

      {/* Stats row for context */}
      <div className="stats-row">
        <div className="stat">
          <div className="label">Total Codes</div>
          <div className="num">{coupons.length}</div>
          <div className="sub">{activeCount} active</div>
        </div>
        <div className="stat">
          <div className="label">Redeemed</div>
          <div className="num teal">{totalRedeemed.toLocaleString()}</div>
          <div className="sub">across all codes</div>
        </div>
        <div className="stat">
          <div className="label">Free Codes</div>
          <div className="num">{coupons.filter((c) => c.planId === "plan_free").length}</div>
          <div className="sub">free plan</div>
        </div>
        <div className="stat">
          <div className="label">Annual Codes</div>
          <div className="num vermilion">
            {coupons.filter((c) => c.planId === "plan_annual").length}
          </div>
          <div className="sub">annual plan</div>
        </div>
      </div>

      {/* Create form */}
      <div className="section-header">
        <h2>Create Coupon</h2>
      </div>

      <form onSubmit={createCoupon} className="surface-card">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <div>
            <label className="input-label">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
              required
              className="input-field"
              style={{ textTransform: "uppercase", fontFamily: "var(--mono)" }}
            />
          </div>
          <div>
            <label className="input-label">Plan</label>
            <select
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="input-field"
              style={{ cursor: "pointer" }}
            >
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Duration (months)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Max Redemptions</label>
            <input
              type="number"
              min="1"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              className="input-field"
            />
          </div>
          {error && (
            <p
              style={{
                gridColumn: "1 / -1",
                color: "var(--vermilion)",
                fontSize: 12,
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </div>
      </form>

      {/* Coupon table */}
      <div className="section-header">
        <h2>All Codes</h2>
        <div className="right">
          <span>{coupons.length} TOTAL</span>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>CODE</th>
            <th>PLAN</th>
            <th>DURATION</th>
            <th className="right">USED / MAX</th>
            <th>EXPIRES</th>
            <th>STATUS</th>
            <th>CREATED</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="row-empty">
              <td colSpan={7}>Loading coupons...</td>
            </tr>
          ) : coupons.length === 0 ? (
            <tr className="row-empty">
              <td colSpan={7}>No coupons yet. Create one above.</td>
            </tr>
          ) : (
            coupons.map((c) => (
              <tr key={c.id}>
                <td className="mono" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  {c.code}
                </td>
                <td>{c.plan?.displayName ?? c.planId}</td>
                <td className="dim">{c.durationMonths}mo</td>
                <td className="right mono">
                  {c._count?.redemptions ?? c.timesRedeemed} / {c.maxRedemptions}
                </td>
                <td className="dim mono">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td>
                  <span className={`pill ${c.isActive ? "success" : "warn"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="dim mono">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
