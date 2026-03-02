# FILE 2 of 4: Admin Panel UI

## OVERVIEW

Complete admin panel accessible at `/admin`. Uses the API routes from File 1. Protected by ADMIN_EMAIL check. Built with Next.js App Router pages + React components. Styled with Tailwind CSS (already in project).

## CRITICAL RULES

1. All admin pages go under `src/app/admin/` directory.
2. Every page must check admin auth before rendering.
3. Use the existing project's layout/styling conventions.
4. Never use em dashes anywhere. Use hyphens instead.
5. All data comes from the `/api/admin/*` routes built in File 1.
6. Use client components (`"use client"`) for interactive parts.
7. Keep components self-contained - no shared component library to build.

---

## 1. ADMIN LAYOUT

Create `src/app/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
// Import your existing auth utility
// import { getServerSession } from 'your-auth-lib';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check
  // const session = await getServerSession();
  // if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
  //   redirect('/');
  // }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AdminSidebar />
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}

function AdminSidebar() {
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'grid' },
    { href: '/admin/users', label: 'Users', icon: 'users' },
    { href: '/admin/tickets', label: 'Tickets', icon: 'ticket' },
    { href: '/admin/coupons', label: 'Coupons', icon: 'tag' },
    { href: '/admin/errors', label: 'Errors & Health', icon: 'alert' },
    { href: '/admin/activity', label: 'Activity Log', icon: 'clock' },
    { href: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50">
      <div className="p-6 border-b border-gray-800">
        {/* Use the OMG AI logo if available, otherwise text */}
        <h1 className="text-xl font-bold text-white">OMG AI Admin</h1>
        <p className="text-xs text-gray-400 mt-1">GSC Connect Dashboard</p>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map(item => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300
                       hover:bg-gray-800 hover:text-white transition-colors text-sm"
          >
            <NavIcon name={item.icon} />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <a href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">
          Back to User Dashboard
        </a>
      </div>
    </aside>
  );
}

// Simple SVG icons - keeps it dependency-free
function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    grid: 'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2m13-4a4 4 0 110-8 4 4 0 010 8zm6 8v-2a4 4 0 00-3-3.87',
    ticket: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    tag: 'M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
    alert: 'M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97L13.75 4a2 2 0 00-3.5 0L3.32 16.03A2 2 0 005.07 19z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  };

  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons.grid} />
    </svg>
  );
}
```

---

## 2. ADMIN DASHBOARD (Main Overview Page)

Create `src/app/admin/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

interface DashboardData {
  users: { total: number; new_this_week: number; new_this_month: number };
  usage: { calls_today: number; calls_this_week: number; calls_this_month: number; top_tools: any[] };
  subscriptions: any[];
  plan_distribution: any[];
  tickets: { open: number };
  notifications: { unread: number };
  errors: { last_24h: number };
  revenue: { mrr_cents: number; mrr_formatted: string };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-red-400">Failed to load dashboard</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-xs text-gray-500">Last refreshed: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Alert Banner - show if there are urgent items */}
      {(data.errors.last_24h > 10 || data.tickets.open > 5) && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300">
          {data.errors.last_24h > 10 && <p>{data.errors.last_24h} errors in the last 24 hours - check the Errors panel.</p>}
          {data.tickets.open > 5 && <p>{data.tickets.open} open support tickets need attention.</p>}
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.users.total} subtitle={`+${data.users.new_this_week} this week`} />
        <StatCard label="MRR" value={data.revenue.mrr_formatted} subtitle={`${data.plan_distribution.filter(p => p.price_cents > 0).reduce((sum, p) => sum + parseInt(p.user_count), 0)} paid users`} color="green" />
        <StatCard label="Open Tickets" value={data.tickets.open} color={data.tickets.open > 0 ? 'yellow' : 'default'} />
        <StatCard label="Errors (24h)" value={data.errors.last_24h} color={data.errors.last_24h > 5 ? 'red' : 'default'} />
      </div>

      {/* KPI Cards Row 2 - Usage */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Calls Today" value={data.usage.calls_today.toLocaleString()} />
        <StatCard label="Calls This Week" value={data.usage.calls_this_week.toLocaleString()} />
        <StatCard label="Calls This Month" value={data.usage.calls_this_month.toLocaleString()} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {data.plan_distribution.map(plan => (
              <div key={plan.name} className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{plan.display_name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {plan.price_cents > 0 ? `$${(plan.price_cents / 100).toFixed(0)}/mo` : 'Free'}
                  </span>
                </div>
                <span className="text-lg font-bold text-white">{plan.user_count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tools */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Tools (7 days)</h2>
          <div className="space-y-2">
            {data.usage.top_tools.slice(0, 8).map((tool, i) => (
              <div key={tool.tool_name} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  <span className="text-gray-600 mr-2">{i + 1}.</span>
                  {tool.tool_name}
                </span>
                <span className="text-white font-medium">{parseInt(tool.call_count).toLocaleString()}</span>
              </div>
            ))}
            {data.usage.top_tools.length === 0 && (
              <p className="text-gray-500 text-sm">No tool usage data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Preview */}
      {data.notifications.unread > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Unread Notifications
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {data.notifications.unread}
              </span>
            </h2>
            <a href="/admin/notifications" className="text-sm text-blue-400 hover:text-blue-300">View all</a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, subtitle, color = 'default' }: {
  label: string; value: string | number; subtitle?: string; color?: string;
}) {
  const colorClasses: Record<string, string> = {
    default: 'border-gray-800',
    green: 'border-green-800/50 bg-green-900/10',
    yellow: 'border-yellow-800/50 bg-yellow-900/10',
    red: 'border-red-800/50 bg-red-900/10',
  };

  return (
    <div className={`bg-gray-900 rounded-lg border p-5 ${colorClasses[color] || colorClasses.default}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

---

## 3. USERS MANAGEMENT PAGE

Create `src/app/admin/users/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_active_at: string | null;
  plan_id: string;
  plan_name: string;
  calls_used: number;
  monthly_calls: number;
  sub_status: string;
  period_end: string;
  gsc_count: number;
  ga4_count: number;
  scope: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handlePlanChange = async (userId: string, planId: string) => {
    if (!confirm(`Change this user to the ${planId} plan?`)) return;
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, reset_usage: false })
    });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users ({total})</h1>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white
                     placeholder-gray-500 w-80 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Usage</th>
              <th className="px-4 py-3 text-left">Properties</th>
              <th className="px-4 py-3 text-left">Scope</th>
              <th className="px-4 py-3 text-left">Last Active</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const usagePercent = user.monthly_calls
                ? Math.round((user.calls_used / user.monthly_calls) * 100)
                : 0;
              const hasGa4 = user.scope?.includes('analytics.readonly');

              return (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <span className="text-white">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.plan_name === 'Premium' ? 'bg-purple-900/50 text-purple-300' :
                      user.plan_name === 'Pro' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {user.plan_name || 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            usagePercent >= 90 ? 'bg-red-500' :
                            usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, usagePercent)}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">
                        {user.calls_used}/{user.monthly_calls}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <span title="GSC properties">GSC: {user.gsc_count || 0}</span>
                    <span className="mx-1 text-gray-600">|</span>
                    <span title="GA4 properties">GA4: {user.ga4_count || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${hasGa4 ? 'text-green-400' : 'text-gray-500'}`}>
                      {hasGa4 ? 'GSC + GA4' : 'GSC only'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {user.last_active_at
                      ? new Date(user.last_active_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                      value={user.plan_id || 'plan_free'}
                      onChange={e => handlePlanChange(user.id, e.target.value)}
                    >
                      <option value="plan_free">Free</option>
                      <option value="plan_pro">Pro</option>
                      <option value="plan_premium">Premium</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {search ? 'No users match your search' : 'No users yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / 50)}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 50)}
              className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. TICKETS MANAGEMENT PAGE

Create `src/app/admin/tickets/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  user_email: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  admin_notes: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/admin/tickets${params}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const openTicket = async (ticketId: string) => {
    setSelectedTicket(ticketId);
    // Use the admin endpoint to get ticket + messages
    // The admin ticket detail route should be added:
    const res = await fetch(`/api/admin/tickets/${ticketId}`);
    const data = await res.json();
    setTicketDetail(data.ticket);
    setMessages(data.messages || []);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    await fetch(`/api/admin/tickets/${selectedTicket}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: replyText })
    });
    setReplyText('');
    openTicket(selectedTicket); // Refresh messages
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchTickets();
    if (selectedTicket === ticketId) openTicket(ticketId);
  };

  const updateTicketPriority = async (ticketId: string, priority: string) => {
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority })
    });
    fetchTickets();
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-900/50 text-red-300',
    high: 'bg-orange-900/50 text-orange-300',
    normal: 'bg-gray-800 text-gray-300',
    low: 'bg-gray-800 text-gray-500',
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-900/50 text-blue-300',
    in_progress: 'bg-yellow-900/50 text-yellow-300',
    resolved: 'bg-green-900/50 text-green-300',
    closed: 'bg-gray-800 text-gray-500',
  };

  const categoryLabels: Record<string, string> = {
    general: 'General',
    connection_error: 'Connection Error',
    billing: 'Billing',
    feature_request: 'Feature Request',
    bug_report: 'Bug Report',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support Tickets</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Ticket List */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className={`p-4 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30 ${
                  selectedTicket === ticket.id ? 'bg-gray-800/50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-medium text-white truncate flex-1 mr-2">{ticket.subject}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>{ticket.user_email}</span>
                  <span>-</span>
                  <span>{categoryLabels[ticket.category] || ticket.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()} - {ticket.message_count} msgs
                  </span>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <p className="p-8 text-center text-gray-500">No tickets{filter ? ` with status "${filter}"` : ''}</p>
            )}
          </div>
        </div>

        {/* Ticket Detail Panel */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          {selectedTicket && ticketDetail ? (
            <div className="flex flex-col h-[70vh]">
              {/* Header */}
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">{ticketDetail.subject}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {ticketDetail.user_email} - {categoryLabels[ticketDetail.category]}
                </p>
                <div className="flex gap-2 mt-3">
                  <select
                    value={ticketDetail.status}
                    onChange={e => updateTicketStatus(selectedTicket, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={ticketDetail.priority}
                    onChange={e => updateTicketPriority(selectedTicket, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.sender_type === 'admin'
                        ? 'bg-blue-900/20 border border-blue-800/30 ml-6'
                        : 'bg-gray-800 mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        msg.sender_type === 'admin' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {msg.sender_type === 'admin' ? 'You (Admin)' : 'User'}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-800">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                             text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    onClick={() => { updateTicketStatus(selectedTicket, 'resolved'); }}
                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[70vh] flex items-center justify-center text-gray-500 text-sm">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**NOTE:** You also need a GET route for admin ticket detail. Add to `src/app/api/admin/tickets/[ticketId]/route.ts`:

```typescript
export async function GET(req: NextRequest, { params }: { params: { ticketId: string } }) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ticket = await db.query(`SELECT st.*, u.email as user_email FROM support_tickets st JOIN users u ON st.user_id = u.id WHERE st.id = $1`, [params.ticketId]);
  if (ticket.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const messages = await db.query(`SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC`, [params.ticketId]);

  return NextResponse.json({ ticket: ticket.rows[0], messages: messages.rows });
}
```

---

## 5. COUPONS MANAGEMENT PAGE

Create `src/app/admin/coupons/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '', plan_id: 'plan_pro', duration_days: 30, max_redemptions: ''
  });

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons');
    const data = await res.json();
    setCoupons(data.coupons || []);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const createCoupon = async () => {
    if (!form.code) return;
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions) : null
      })
    });
    setShowCreate(false);
    setForm({ code: '', plan_id: 'plan_pro', duration_days: 30, max_redemptions: '' });
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupon Codes</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
        >
          + Create Coupon
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MYCODE"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Plan</label>
              <select
                value={form.plan_id}
                onChange={e => setForm({ ...form, plan_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="plan_pro">Pro</option>
                <option value="plan_premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Duration (days)</label>
              <input
                type="number"
                value={form.duration_days}
                onChange={e => setForm({ ...form, duration_days: parseInt(e.target.value) || 30 })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Max Redemptions</label>
              <input
                type="number"
                value={form.max_redemptions}
                onChange={e => setForm({ ...form, max_redemptions: e.target.value })}
                placeholder="Unlimited"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button onClick={createCoupon} className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm">Create</button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Redemptions</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id} className="border-b border-gray-800/50">
                <td className="px-4 py-3 font-mono text-white font-bold">{coupon.code}</td>
                <td className="px-4 py-3 text-gray-300">{coupon.plan_name}</td>
                <td className="px-4 py-3 text-gray-400">{coupon.duration_days} days</td>
                <td className="px-4 py-3 text-gray-300">
                  {coupon.times_redeemed}
                  {coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ' / unlimited'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    coupon.is_active ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(coupon.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 6. ERRORS & HEALTH PAGE

Create `src/app/admin/errors/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

export default function ErrorsPage() {
  const [data, setData] = useState<any>(null);
  const [hours, setHours] = useState(24);
  const [service, setService] = useState('');

  const fetchErrors = async () => {
    const params = new URLSearchParams({ hours: String(hours), ...(service && { service }) });
    const res = await fetch(`/api/admin/errors?${params}`);
    setData(await res.json());
  };

  useEffect(() => { fetchErrors(); }, [hours, service]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Errors & Connection Health</h1>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={hours}
          onChange={e => setHours(parseInt(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
        >
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={48}>Last 48 hours</option>
          <option value={168}>Last 7 days</option>
        </select>
        <select
          value={service}
          onChange={e => setService(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">All Services</option>
          <option value="gsc">GSC</option>
          <option value="ga4">GA4</option>
        </select>
      </div>

      {data && (
        <>
          {/* Error Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {data.summary?.map((s: any) => (
              <div key={s.service} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase">{s.service} Errors</p>
                <p className="text-2xl font-bold text-white mt-1">{s.error_count}</p>
                <p className="text-xs text-gray-500 mt-1">{s.affected_users} affected users</p>
              </div>
            ))}
            {(!data.summary || data.summary.length === 0) && (
              <div className="col-span-3 bg-green-900/10 border border-green-800/30 rounded-lg p-4 text-center text-green-300 text-sm">
                No errors in the last {hours} hours. All clear!
              </div>
            )}
          </div>

          {/* Token Issues */}
          {data.token_issues?.length > 0 && (
            <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-yellow-300 mb-3">
                Users with Potential Token Issues ({data.token_issues.length})
              </h2>
              <div className="space-y-2">
                {data.token_issues.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{user.email}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs">
                        Token updated: {new Date(user.token_updated_at).toLocaleString()}
                      </span>
                      <span className={`text-xs ${user.scope?.includes('analytics') ? 'text-green-400' : 'text-yellow-400'}`}>
                        {user.scope?.includes('analytics') ? 'Full scope' : 'GSC only'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Log Table */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900">
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Tool</th>
                    <th className="px-4 py-3 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.errors?.slice(0, 100).map((err: any) => (
                    <tr key={err.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(err.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-gray-300 text-xs">{err.user_email || 'Unknown'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          err.service === 'gsc' ? 'bg-blue-900/50 text-blue-300' :
                          err.service === 'ga4' ? 'bg-purple-900/50 text-purple-300' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {(err.service || 'unknown').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs">{err.tool_name || '-'}</td>
                      <td className="px-4 py-2 text-red-400 text-xs truncate max-w-md" title={err.error_message}>
                        {err.error_message || err.message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 7. ACTIVITY LOG PAGE

Create `src/app/admin/activity/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

export default function ActivityPage() {
  const [activity, setActivity] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '200', ...(filter && { action: filter }) });
    fetch(`/api/admin/activity?${params}`)
      .then(r => r.json())
      .then(data => setActivity(data.activity || []));
  }, [filter]);

  const actionColors: Record<string, string> = {
    user_signup: 'text-green-400',
    tool_call: 'text-gray-400',
    plan_change: 'text-blue-400',
    coupon_redeemed: 'text-purple-400',
    ticket_created: 'text-yellow-400',
    ticket_resolved: 'text-green-400',
    connection_error: 'text-red-400',
    token_expired: 'text-red-400',
    payment_success: 'text-green-400',
    payment_failed: 'text-red-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Activity Log</h1>

      <div className="flex gap-2 flex-wrap">
        {['', 'user_signup', 'plan_change', 'coupon_redeemed', 'ticket_created',
          'connection_error', 'token_expired'].map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              filter === a ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {a === '' ? 'All' : a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="max-h-[70vh] overflow-y-auto">
          {activity.map(item => (
            <div key={item.id} className="px-4 py-3 border-b border-gray-800/50 flex items-center gap-4 text-sm">
              <span className="text-gray-600 text-xs w-40 shrink-0">
                {new Date(item.created_at).toLocaleString()}
              </span>
              <span className={`w-36 shrink-0 text-xs font-medium ${actionColors[item.action] || 'text-gray-400'}`}>
                {item.action}
              </span>
              <span className="text-gray-400 text-xs w-48 shrink-0 truncate">{item.user_email || '-'}</span>
              <span className="text-gray-500 text-xs truncate">
                {item.details ? JSON.stringify(item.details) : '-'}
              </span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="p-8 text-center text-gray-500">No activity logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 8. NOTIFICATIONS PAGE

Create `src/app/admin/notifications/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    const params = unreadOnly ? '?unread=true' : '';
    const res = await fetch(`/api/admin/notifications${params}`);
    const data = await res.json();
    setNotifications(data.notifications || []);
  };

  useEffect(() => { fetchNotifications(); }, [unreadOnly]);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true })
    });
    fetchNotifications();
  };

  const markRead = async (ids: string[]) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    fetchNotifications();
  };

  const severityColors: Record<string, string> = {
    info: 'border-l-blue-500',
    warning: 'border-l-yellow-500',
    error: 'border-l-red-500',
    critical: 'border-l-red-600 bg-red-900/10',
  };

  const typeIcons: Record<string, string> = {
    new_user: 'New User',
    connection_error: 'Connection',
    ticket_opened: 'Ticket',
    payment_failed: 'Payment',
    usage_limit_hit: 'Usage Limit',
    token_expired: 'Token',
    high_error_rate: 'Errors',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={e => setUnreadOnly(e.target.checked)}
              className="rounded"
            />
            Unread only
          </label>
          <button
            onClick={markAllRead}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 rounded"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead([n.id])}
            className={`bg-gray-900 border border-gray-800 border-l-4 rounded-lg p-4 cursor-pointer
                       ${severityColors[n.severity]}
                       ${!n.is_read ? 'bg-gray-900' : 'opacity-60'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {typeIcons[n.type] || n.type}
                  </span>
                  {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
                <h3 className="text-sm font-medium text-white">{n.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{n.message}</p>
              </div>
              <span className="text-xs text-gray-600 shrink-0 ml-4">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## 9. FILE STRUCTURE SUMMARY

New files to create:

```
src/app/admin/
  layout.tsx                    -- Admin layout with sidebar
  page.tsx                      -- Dashboard overview
  users/page.tsx                -- Users management
  tickets/page.tsx              -- Ticket management (split view)
  coupons/page.tsx              -- Coupon management
  errors/page.tsx               -- Error logs & connection health
  activity/page.tsx             -- Activity log
  notifications/page.tsx        -- Notifications center

src/app/api/admin/tickets/[ticketId]/
  route.ts                      -- GET admin ticket detail (addition to File 1)
```

---

## 10. TESTING CHECKLIST

- [ ] Admin layout renders with sidebar navigation
- [ ] Non-admin users get redirected (403 or redirect to /)
- [ ] Dashboard shows KPI cards with real data
- [ ] Dashboard shows alert banner when errors > 10 or tickets > 5
- [ ] Users page loads with search and pagination
- [ ] Users page shows usage progress bars
- [ ] Admin can change user plan from dropdown
- [ ] Tickets page loads with status filters
- [ ] Clicking a ticket shows messages thread
- [ ] Admin can reply to tickets
- [ ] Admin can change ticket status and priority
- [ ] Coupons page lists all coupons with redemption counts
- [ ] Create coupon form works
- [ ] Errors page shows error summary cards
- [ ] Errors page highlights users with token issues
- [ ] Activity log displays with action filters
- [ ] Notifications page shows with unread indicators
- [ ] Mark all read works
- [ ] All pages are dark theme consistent
