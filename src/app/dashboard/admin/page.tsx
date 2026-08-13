"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { Building2, Users, GraduationCap, ShieldCheck, DollarSign, TrendingUp, Calendar, CreditCard, Search, X } from "lucide-react";

type School = {
  id: string; name: string; logoUrl: string | null; createdAt: string;
  director: { fullName: string; email: string | null; phone: string | null; status: string };
  subscription: { plan: string; endDate: string } | null;
};
type AdminData = {
  schools: School[]; users: { directors: number; teachers: number; students: number };
  planBreakdown: { plan: string; _count: number }[];
  totalRevenue: number;
  recentPayments: { id: string; amount: number; plan: string; status: string; createdAt: string; school: { name: string } | null }[];
};

export default function AdminPage() {
  const { success, error } = useToast();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError(null);
    api<AdminData>("/api/admin/stats")
      .then(setData)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleStatus = async (id: string, status: "ACTIVE" | "SUSPENDED") => {
    if (!confirm(`${status === "SUSPENDED" ? "Suspend" : "Activate"} this school?`)) return;
    try {
      await api(`/api/admin/schools/${id}`, { method: "PATCH", json: { status } });
      success("Updated"); load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loadError) return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-3 text-sm text-red-500">{loadError}</p>
          <button onClick={load} className="btn-primary text-sm">Retry</button>
        </div>
      </div>
    </DashboardShell>
  );

  if (loading || !data) return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-brand-orange" /></div>
    </DashboardShell>
  );

  const totalUsers = data.users.directors + data.users.teachers + data.users.students;
  const filteredSchools = data.schools.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.director.fullName.toLowerCase().includes(search.toLowerCase()));
  const maxPlanCount = Math.max(...data.planBreakdown.map((p) => p._count), 1);

  return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">Admin Panel</h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Platform overview & management.</p>
          </div>
          <button onClick={load} className="btn-outline flex items-center gap-2 text-xs">Refresh</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          <StatCard icon={Building2} label="Schools" value={String(data.schools.length)} sub="Registered" color="from-blue-600 to-blue-800" />
          <StatCard icon={ShieldCheck} label="Directors" value={String(data.users.directors)} sub={`${((data.users.directors / totalUsers) * 100).toFixed(0)}% of users`} color="from-indigo-500 to-indigo-700" />
          <StatCard icon={Users} label="Teachers" value={String(data.users.teachers)} sub={`${((data.users.teachers / totalUsers) * 100).toFixed(0)}% of users`} color="from-emerald-500 to-emerald-700" />
          <StatCard icon={GraduationCap} label="Students" value={String(data.users.students)} sub={`${((data.users.students / totalUsers) * 100).toFixed(0)}% of users`} color="from-cyan-500 to-cyan-700" />
          <StatCard icon={DollarSign} label="Revenue" value={`$${data.totalRevenue.toFixed(0)}`} sub="Total collected" color="from-pink-500 to-pink-700" />
          <StatCard icon={TrendingUp} label="Avg / School" value={`$${(data.totalRevenue / (data.schools.length || 1)).toFixed(0)}`} sub="Per school" color="from-purple-500 to-purple-700" />
        </div>

        {/* Plan Distribution + Recent Payments */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <CreditCard className="h-4 w-4" /> Plan Distribution
            </h2>
            {data.planBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No subscriptions yet.</p>
            ) : (
              <div className="space-y-3">
                {data.planBreakdown.map((p) => (
                  <div key={p.plan}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-brand-ink dark:text-brand-paper">{p.plan.replace("_", " ")}</span>
                      <span className="text-gray-500">{p._count} school{p._count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-400 transition-all duration-500" style={{ width: `${(p._count / maxPlanCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <Calendar className="h-4 w-4" /> Recent Payments
            </h2>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentPayments.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm dark:bg-white/5">
                    <div className="min-w-0">
                      <div className="font-semibold text-brand-ink dark:text-brand-paper">{p.school?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{p.plan} • {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold text-brand-orange">${p.amount}</div>
                      <span className={`text-[10px] font-semibold uppercase ${p.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schools Management */}
        <div className="card overflow-hidden">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <Building2 className="h-4 w-4" /> All Schools ({data.schools.length})
            </h2>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search schools..." className="input-field !py-1.5 !ps-9 !text-xs" />
              {search && <button onClick={() => setSearch("")} className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
          {filteredSchools.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">{search ? "No schools match your search." : "No schools registered yet."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 dark:border-white/5">
                  <th className="py-3 text-start font-semibold">School</th>
                  <th className="py-3 text-start font-semibold">Director</th>
                  <th className="py-3 text-start font-semibold">Plan</th>
                  <th className="py-3 text-start font-semibold">Status</th>
                  <th className="py-3 text-end font-semibold">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {filteredSchools.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" /> : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange/15 text-xs font-bold text-brand-orange">{s.name.charAt(0)}</div>
                          )}
                          <div>
                            <div className="font-semibold text-brand-ink dark:text-brand-paper">{s.name}</div>
                            <div className="text-[10px] text-gray-500">Joined {new Date(s.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-brand-ink/80 dark:text-white/80">{s.director.fullName}</div>
                        <div className="text-[10px] text-gray-500">{s.director.email || s.director.phone}</div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          s.subscription?.plan === "ANNUAL" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" :
                          s.subscription?.plan === "MONTHLY" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                        }`}>{s.subscription?.plan?.replace("_", " ") || "No plan"}</span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.director.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.director.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                          {s.director.status}
                        </span>
                      </td>
                      <td className="py-3 text-end">
                        <button onClick={() => toggleStatus(s.id, s.director.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                            s.director.status === "ACTIVE"
                              ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          }`}>
                          {s.director.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br opacity-[0.04] dark:opacity-[0.08]" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 z-10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
          <div className="mt-1 truncate font-display text-2xl font-extrabold text-brand-ink dark:text-brand-paper sm:text-3xl">{value}</div>
          <div className="mt-0.5 text-[10px] text-gray-400">{sub}</div>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
