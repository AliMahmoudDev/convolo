"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Loader2,
  AlertTriangle,
  Crown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPlanBadge(plan: string) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent-primary)]">
      <Crown className="h-3 w-3" />
      {plan === "pro_monthly" ? "Pro Monthly" : plan === "pro_yearly" ? "Pro Yearly" : "Pro"}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      } else {
        setError(data.error?.message || "Failed to fetch users");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handlePlanToggle = async (userId: string, currentPlan: string) => {
    const newPlan = currentPlan === "free" ? "pro_monthly" : "free";
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User plan updated to ${newPlan === "free" ? "Free" : "Pro"}`);
        fetchUsers();
      } else {
        toast.error(data.error?.message || "Failed to update user plan");
      }
    } catch {
      toast.error("Network error — failed to update user plan");
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "canceled" : "active";
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User status updated to ${newStatus}`);
        fetchUsers();
      } else {
        toast.error(data.error?.message || "Failed to update user status");
      }
    } catch {
      toast.error("Network error — failed to update user status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage platform users — {total} total
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pr-4 pl-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            />
          </div>
        </form>

        {/* Plan filter */}
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--state-error)]/20 bg-[var(--state-error-light)] px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-[var(--state-error)]" />
          <p className="text-sm text-[var(--state-error)]">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Users className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              {search || planFilter ? "No users match your filters" : "No users yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Email
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] md:table-cell">
                      Languages
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] sm:table-cell">
                      Level
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Plan
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] lg:table-cell">
                      Status
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] lg:table-cell">
                      Joined
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-elevated)]/50"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                        {user.name}
                      </td>
                      <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                        {user.email}
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-[var(--text-secondary)] md:table-cell">
                        {user.nativeLanguage}
                        {user.targetLanguage ? ` → ${user.targetLanguage}` : ""}
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-[var(--text-secondary)] capitalize sm:table-cell">
                        {user.proficiencyLevel}
                      </td>
                      <td className="px-5 py-3">{getPlanBadge(user.plan)}</td>
                      <td className="hidden px-5 py-3 lg:table-cell">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            user.status === "active"
                              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                          )}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-[var(--text-muted)] lg:table-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePlanToggle(user.id, user.plan)}
                            disabled={updating === user.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50",
                              user.plan === "free"
                                ? "bg-[var(--accent-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/80"
                            )}
                          >
                            {updating === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Crown className="h-3 w-3" />
                            )}
                            {user.plan === "free" ? "Upgrade" : "Downgrade"}
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user.id, user.status)}
                            disabled={updating === user.id}
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] disabled:opacity-50"
                          >
                            {user.status === "active" ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[var(--border-default)] px-5 py-3">
              <p className="text-xs text-[var(--text-muted)]">
                Page {page} of {totalPages} — {total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-[var(--border-default)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-[var(--border-default)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
