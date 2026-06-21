"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Search,
  Loader2,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminScenario {
  id: string;
  title: string;
  description: string;
  languagePair: string;
  category: string;
  difficultyLevel: string;
  openingLine: string;
  isPremium: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ScenariosResponse {
  scenarios: AdminScenario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORIES = ["daily", "travel", "business", "academic", "social", "medical"];
const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCategoryBadge(category: string) {
  const colors: Record<string, string> = {
    daily: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    travel: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    business: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
    academic: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    social: "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
    medical: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        colors[category] || "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
      )}
    >
      {category}
    </span>
  );
}

// Scenario form modal
function ScenarioModal({
  scenario,
  onClose,
  onSave,
}: {
  scenario: AdminScenario | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const isEdit = !!scenario;

  const [form, setForm] = useState({
    title: scenario?.title || "",
    description: scenario?.description || "",
    category: scenario?.category || "daily",
    difficultyLevel: scenario?.difficultyLevel || "intermediate",
    targetLanguage: scenario?.languagePair?.split("-")[1] || "ar",
    openingLine: scenario?.openingLine || "",
    isPremium: scenario?.isPremium || false,
    isPublished: scenario?.isPublished || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (isEdit) {
        payload.id = scenario.id;
      }
      await onSave(payload);
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Scenario" : "Create Scenario"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                placeholder="e.g., Ordering at a Restaurant"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Description *
              </label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                placeholder="Describe the scenario..."
              />
            </div>

            {/* Category + Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Difficulty
                </label>
                <select
                  value={form.difficultyLevel}
                  onChange={(e) => setForm({ ...form, difficultyLevel: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Language */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Target Language
              </label>
              <select
                value={form.targetLanguage}
                onChange={(e) => setForm({ ...form, targetLanguage: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="ar">Arabic</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
                <option value="pt">Portuguese</option>
                <option value="it">Italian</option>
                <option value="ru">Russian</option>
                <option value="hi">Hindi</option>
                <option value="tr">Turkish</option>
              </select>
            </div>

            {/* Opening Line */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Opening Line
              </label>
              <input
                type="text"
                value={form.openingLine}
                onChange={(e) => setForm({ ...form, openingLine: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                placeholder="e.g., Welcome! How can I help you today?"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                />
                <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Crown className="h-3.5 w-3.5" /> Premium
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Published</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Scenario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<AdminScenario[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<AdminScenario | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/admin/scenarios?${params}`);
      const data = await res.json();
      if (data.success) {
        setScenarios(data.data.scenarios);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      } else {
        setError(data.error?.message || "Failed to fetch scenarios");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSave = async (data: Record<string, unknown>) => {
    const isEdit = !!data.id;
    const res = await fetch("/api/admin/scenarios", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      toast.success(isEdit ? "Scenario updated" : "Scenario created");
      fetchScenarios();
    } else {
      toast.error(result.error?.message || "Failed to save scenario");
      throw new Error("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/scenarios?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Scenario deleted");
        fetchScenarios();
      } else {
        toast.error(data.error?.message || "Failed to delete scenario");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublished = async (scenario: AdminScenario) => {
    setToggling(scenario.id);
    try {
      const res = await fetch("/api/admin/scenarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scenario.id,
          isPublished: !scenario.isPublished,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(scenario.isPublished ? "Scenario unpublished" : "Scenario published");
        fetchScenarios();
      } else {
        toast.error(data.error?.message || "Failed to toggle");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setToggling(null);
    }
  };

  const handleTogglePremium = async (scenario: AdminScenario) => {
    setToggling(scenario.id);
    try {
      const res = await fetch("/api/admin/scenarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scenario.id,
          isPremium: !scenario.isPremium,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(scenario.isPremium ? "Made free" : "Made premium");
        fetchScenarios();
      } else {
        toast.error(data.error?.message || "Failed to toggle");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setToggling(null);
    }
  };

  const openCreateModal = () => {
    setEditingScenario(null);
    setModalOpen(true);
  };

  const openEditModal = (scenario: AdminScenario) => {
    setEditingScenario(scenario);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Scenarios</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage conversation scenarios — {total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchScenarios}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Plus className="h-4 w-4" />
            New Scenario
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            />
          </div>
        </form>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
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
        ) : scenarios.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              {search || categoryFilter ? "No scenarios match your filters" : "No scenarios yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Title
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] md:table-cell">
                      Category
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] sm:table-cell">
                      Difficulty
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] lg:table-cell">
                      Language
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Status
                    </th>
                    <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] lg:table-cell">
                      Updated
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((scenario) => (
                    <tr
                      key={scenario.id}
                      className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-elevated)]/50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {scenario.title}
                          </p>
                          {scenario.isPremium && (
                            <Crown className="h-3.5 w-3.5 text-[var(--color-gold)]" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-[var(--text-muted)]">
                          {scenario.description}
                        </p>
                      </td>
                      <td className="hidden px-5 py-3 md:table-cell">
                        {getCategoryBadge(scenario.category)}
                      </td>
                      <td className="hidden px-5 py-3 text-sm capitalize text-[var(--text-secondary)] sm:table-cell">
                        {scenario.difficultyLevel}
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-[var(--text-secondary)] lg:table-cell">
                        {scenario.languagePair}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              scenario.isPublished
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                            )}
                          >
                            {scenario.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3 text-sm text-[var(--text-muted)] lg:table-cell">
                        {formatDate(scenario.updatedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePublished(scenario)}
                            disabled={toggling === scenario.id}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] disabled:opacity-50"
                            title={scenario.isPublished ? "Unpublish" : "Publish"}
                          >
                            {toggling === scenario.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : scenario.isPublished ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(scenario)}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)]"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(scenario.id)}
                            disabled={deleting === scenario.id}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--state-error-light)] hover:text-[var(--state-error)] disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === scenario.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
                Page {page} of {totalPages} — {total} scenarios
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

      {/* Modal */}
      {modalOpen && (
        <ScenarioModal
          scenario={editingScenario}
          onClose={() => {
            setModalOpen(false);
            setEditingScenario(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
