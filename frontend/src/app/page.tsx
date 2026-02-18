"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ShieldAlert,
  Search,
  RefreshCw,
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ── API helpers (inline to keep single-file simplicity) ─────────── */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document {
  id: number;
  filename: string;
  status: string;
  doc_type?: string;
  created_at: string;
  open_findings: number;
}

interface DashboardStats {
  processing: number;
  needs_review: number;
  completed: number;
  failed: number;
  open_findings: number;
  total: number;
}

async function fetchJSON(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  return res.json();
}

async function postFile(path: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  await fetch(`${API_URL}${path}`, { method: "POST", body: fd });
}

async function postJSON(path: string) {
  await fetch(`${API_URL}${path}`, { method: "POST" });
}

/* ── Status maps ─────────────────────────────────────────────────── */

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Pending", badge: "badge-pending", dot: "bg-slate-400" },
  PROCESSING: { label: "Processing", badge: "badge-processing", dot: "bg-amber-400" },
  REVIEW_NEEDED: { label: "Needs Review", badge: "badge-review", dot: "bg-orange-400" },
  COMPLETED: { label: "Completed", badge: "badge-completed", dot: "bg-emerald-400" },
  FAILED: { label: "Failed", badge: "badge-failed", dot: "bg-rose-400" },
};

const TYPE_MAP: Record<string, { label: string; badge: string }> = {
  invoice: { label: "Invoice", badge: "badge-invoice" },
  contract: { label: "Contract", badge: "badge-contract" },
};

/* ── Dashboard Component ─────────────────────────────────────────── */

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        fetchJSON("/documents"),
        fetchJSON("/dashboard/stats"),
      ]);
      setDocs(d.documents || []);
      setStats(s);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) await postFile("/upload", files[i]);
      await load();
    } catch {
      /* silently fail in demo */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAction = async (id: number, type?: string) => {
    setActionId(id);
    try {
      if (type === "invoice") await postJSON(`/documents/${id}/analyze`);
      else await postJSON(`/contracts/${id}/risk_assessment`);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const filtered = docs.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.filename.toLowerCase().includes(q) || (d.doc_type || "").includes(q);
    }
    return true;
  });

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* ─── Sidebar ───────────────────────────────────────────── */}
      <aside className="sidebar animate-slide-in-left">
        {/* Logo */}
        <div className="px-6 py-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center animate-gradient"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Contract
                <span className="gradient-text"> Intelligence</span>
              </h1>
              <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                AI Audit Platform
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          <p className="px-7 mb-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            Menu
          </p>
          <Link href="/" className="sidebar-link active">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/evaluations" className="sidebar-link">
            <BarChart3 className="h-4 w-4" /> Evaluations
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              CA
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Admin</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Chartered Accountant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main ──────────────────────────────────────────────── */}
      <main className="flex-1" style={{ marginLeft: "var(--sidebar-width)" }}>
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(11, 15, 26, 0.8)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Dashboard
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI-Powered Invoice & Contract Analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="btn btn-ghost" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="relative">
              <input
                ref={fileRef}
                type="file"
                onChange={(e) => handleUpload(e.target.files)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                accept=".pdf"
                multiple
              />
              <button className="btn btn-primary">
                {uploading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload PDF
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* ─── Stats ──────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger">
              <StatCard
                label="Total Docs"
                value={stats.total}
                icon={<FolderOpen className="h-5 w-5" style={{ color: "var(--accent-indigo)" }} />}
                onClick={() => setFilter("all")}
                active={filter === "all"}
              />
              <StatCard
                label="Processing"
                value={stats.processing}
                icon={<Clock className="h-5 w-5" style={{ color: "var(--accent-amber)" }} />}
                onClick={() => setFilter("PROCESSING")}
                active={filter === "PROCESSING"}
                accentColor="var(--accent-amber)"
              />
              <StatCard
                label="Review"
                value={stats.needs_review}
                icon={<AlertTriangle className="h-5 w-5" style={{ color: "#fb923c" }} />}
                onClick={() => setFilter("REVIEW_NEEDED")}
                active={filter === "REVIEW_NEEDED"}
                accentColor="#fb923c"
              />
              <StatCard
                label="Completed"
                value={stats.completed}
                icon={<CheckCircle className="h-5 w-5" style={{ color: "var(--accent-emerald)" }} />}
                onClick={() => setFilter("COMPLETED")}
                active={filter === "COMPLETED"}
                accentColor="var(--accent-emerald)"
              />
              <StatCard
                label="Open Findings"
                value={stats.open_findings}
                icon={<ShieldAlert className="h-5 w-5" style={{ color: "var(--accent-rose)" }} />}
                accentColor="var(--accent-rose)"
              />
            </div>
          )}

          {/* ─── Dropzone ───────────────────────────────────── */}
          <div
            className={`dropzone mb-8 animate-fade-in ${dragOver ? "active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          >
            <div className="relative z-10">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 animate-float"
                style={{ background: "var(--accent-indigo-glow)", border: "1px solid var(--border-accent)" }}>
                <Sparkles className="h-6 w-6" style={{ color: "var(--accent-indigo)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {uploading ? "Uploading..." : "Drag & drop PDF files here"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                or click "Upload PDF" button above
              </p>
            </div>
          </div>

          {/* ─── Toolbar ────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ─── Table ──────────────────────────────────────── */}
          <div
            className="glass-card overflow-hidden animate-slide-up"
            style={{ animationDelay: "0.15s" }}
          >
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th>Uploaded</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const st = STATUS_MAP[doc.status] || STATUS_MAP.PENDING;
                  const tp = doc.doc_type ? TYPE_MAP[doc.doc_type] : null;
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--accent-indigo-glow)", border: "1px solid var(--border-accent)" }}
                          >
                            <FileText className="h-4 w-4" style={{ color: "var(--accent-indigo)" }} />
                          </div>
                          <div>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="text-sm font-medium truncate-name block"
                              style={{ color: "var(--text-primary)", textDecoration: "none" }}
                            >
                              {doc.filename}
                            </Link>
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              ID: {doc.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {tp ? (
                          <span className={`badge ${tp.badge}`}>{tp.label}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${st.badge}`}>
                          {doc.status === "PROCESSING" && <Loader2 className="animate-spin h-3 w-3" />}
                          <span className={`glow-dot ${st.dot}`} style={{ width: 6, height: 6, animation: "none" }} />
                          {st.label}
                        </span>
                      </td>
                      <td>
                        {doc.open_findings > 0 ? (
                          <span className="badge badge-severity-high">
                            <AlertTriangle className="h-3 w-3" /> {doc.open_findings}
                          </span>
                        ) : doc.status === "COMPLETED" ? (
                          <span className="text-xs" style={{ color: "var(--accent-emerald)" }}>✓ Clear</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(doc.created_at).toLocaleDateString()}{" "}
                        {new Date(doc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === "REVIEW_NEEDED" && doc.doc_type && (
                            <button
                              onClick={() => handleAction(doc.id, doc.doc_type)}
                              disabled={actionId === doc.id}
                              className="btn btn-primary"
                              style={{ padding: "5px 12px", fontSize: 12 }}
                            >
                              {actionId === doc.id ? (
                                <Loader2 className="animate-spin h-3 w-3" />
                              ) : (
                                doc.doc_type === "invoice" ? "Match" : "Risk"
                              )}
                            </button>
                          )}
                          <Link
                            href={`/documents/${doc.id}`}
                            className="btn btn-secondary"
                            style={{ padding: "5px 12px", fontSize: 12, textDecoration: "none" }}
                          >
                            View <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty-state">
                <FileText className="h-12 w-12 mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                {docs.length === 0 ? (
                  <>
                    <p className="text-sm font-medium mb-1">No documents yet</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Upload a contract or invoice PDF to get started.
                    </p>
                  </>
                ) : (
                  <p className="text-xs">No documents match your filter.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────── */

function StatCard({
  label, value, icon, onClick, active, accentColor,
}: {
  label: string; value: number; icon: React.ReactNode;
  onClick?: () => void; active?: boolean; accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`stat-card text-left w-full animate-fade-in ${active ? "active" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        {icon}
      </div>
      <span className="text-3xl font-extrabold animate-count-up block" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </button>
  );
}
