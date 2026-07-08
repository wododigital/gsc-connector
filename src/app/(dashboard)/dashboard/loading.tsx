/**
 * Shared loading skeleton for every /dashboard/* route.
 *
 * Next.js paints this instantly on navigation while the target page's
 * server component resolves its data (session/DB/Google API calls) -
 * without it, the browser shows nothing until the whole page is ready,
 * which reads as "not instant" even though the click registered right away.
 */
function Bar({ width = "100%", height = 14 }: { width?: string; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        background: "var(--surface-2)",
        border: "1px solid var(--rule)",
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Bar width="220px" height={24} />
          <Bar width="380px" height={13} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--rule-strong)",
            padding: "18px 22px",
          }}
        >
          <Bar width="140px" height={12} />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--rule-strong)",
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Bar width="200px" height={14} />
            <Bar width="60%" height={11} />
          </div>
        ))}
      </div>
    </>
  );
}
