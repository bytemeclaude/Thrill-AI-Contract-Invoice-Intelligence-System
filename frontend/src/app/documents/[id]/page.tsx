"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    Zap,
    ShieldCheck,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    BarChart3,
    Eye,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Finding {
    id: number;
    document_id: number;
    finding_type: string;
    severity: string;
    description: string;
    evidence: any;
    status: string;
}

interface DocData {
    id: number;
    filename: string;
    status: string;
    result?: any;
}

async function fetchJSON(path: string) {
    const res = await fetch(`${API_URL}${path}`);
    return res.json();
}

async function postJSON(path: string, body?: object) {
    const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
    });
    return res.json();
}

const SEVERITY_BADGE: Record<string, string> = {
    critical: "badge-severity-critical",
    high: "badge-severity-high",
    medium: "badge-severity-medium",
    low: "badge-severity-low",
};

export default function DocumentDetails() {
    const { id } = useParams();
    const docId = parseInt(id as string);

    const [doc, setDoc] = useState<DocData | null>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [riskRunning, setRiskRunning] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (!docId) return;
        loadData();
    }, [docId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docData, findingsData] = await Promise.all([
                fetchJSON(`/documents/${docId}/extraction`),
                fetchJSON(`/documents/${docId}/findings`),
            ]);
            setDoc(docData);
            setFindings(findingsData.findings || []);
            try {
                const u = await fetchJSON(`/documents/${docId}/pdf`);
                setPdfUrl(u.url);
            } catch { /* noop */ }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            await postJSON(`/documents/${docId}/analyze`);
            const updated = await fetchJSON(`/documents/${docId}/findings`);
            setFindings(updated.findings || []);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleRisk = async () => {
        setRiskRunning(true);
        try {
            const { task_id } = await postJSON(`/contracts/${docId}/risk_assessment`);
            // Poll
            for (let i = 0; i < 60; i++) {
                const s = await fetchJSON(`/tasks/${task_id}/status`);
                if (s.state === "SUCCESS") break;
                if (s.state === "FAILURE") break;
                await new Promise((r) => setTimeout(r, 2000));
            }
            const updated = await fetchJSON(`/documents/${docId}/findings`);
            setFindings(updated.findings || []);
        } finally {
            setRiskRunning(false);
        }
    };

    const handleReview = async (findingId: number, decision: "APPROVE" | "OVERRIDE") => {
        await postJSON(`/findings/${findingId}/review`, { decision });
        setFindings((prev) =>
            prev.map((f) =>
                f.id === findingId
                    ? { ...f, status: decision === "APPROVE" ? "reviewed" : "overridden" }
                    : f
            )
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin h-8 w-8" style={{ color: "var(--accent-indigo)" }} />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading document...</p>
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
                <p style={{ color: "var(--text-muted)" }}>Document not found</p>
            </div>
        );
    }

    const mismatchFindings = findings.filter((f) =>
        ["term_mismatch", "rate_mismatch", "calculation_error", "missing_po", "anomaly"].includes(f.finding_type)
    );
    const riskFindings = findings.filter(
        (f) => !["term_mismatch", "rate_mismatch", "calculation_error", "missing_po", "anomaly"].includes(f.finding_type)
    );
    const openCount = findings.filter((f) => f.status === "open").length;

    return (
        <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
            {/* Header */}
            <header
                className="flex items-center justify-between px-6 py-3 z-10 animate-fade-in"
                style={{
                    background: "rgba(11, 15, 26, 0.9)",
                    backdropFilter: "blur(16px)",
                    borderBottom: "1px solid var(--border-subtle)",
                }}
            >
                <div className="flex items-center gap-4">
                    <Link href="/" className="btn btn-ghost" style={{ padding: 6 }}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                            {doc.filename}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="badge badge-pending" style={{ fontSize: 10 }}>
                                {doc.status}
                            </span>
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                ID: {doc.id}
                            </span>
                            {openCount > 0 && (
                                <span className="badge badge-severity-high" style={{ fontSize: 10 }}>
                                    <AlertTriangle className="h-3 w-3" /> {openCount} open
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary" style={{ fontSize: 12 }}>
                        {analyzing && <Loader2 className="animate-spin h-3 w-3" />}
                        <Eye className="h-3.5 w-3.5" /> Match Analysis
                    </button>
                    <button onClick={handleRisk} disabled={riskRunning} className="btn btn-secondary" style={{ fontSize: 12 }}>
                        {riskRunning && <Loader2 className="animate-spin h-3 w-3" />}
                        <ShieldCheck className="h-3.5 w-3.5" /> {riskRunning ? "Assessing..." : "Risk Analysis"}
                    </button>
                </div>
            </header>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* PDF Panel */}
                <div
                    className="w-1/2 flex items-center justify-center"
                    style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)" }}
                >
                    {pdfUrl ? (
                        <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin h-6 w-6" style={{ color: "var(--text-muted)" }} />
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading PDF preview...</p>
                        </div>
                    )}
                </div>

                {/* Findings Panel */}
                <div className="w-1/2 flex flex-col overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
                    {/* Mismatches */}
                    <Section
                        title="Mismatches & Anomalies"
                        count={mismatchFindings.length}
                        icon={<AlertTriangle className="h-4 w-4" style={{ color: "#fb923c" }} />}
                    >
                        {mismatchFindings.length === 0 ? (
                            <EmptySection text='No mismatches found. Click "Match Analysis" to check.' />
                        ) : (
                            <div className="space-y-3 stagger">
                                {mismatchFindings.map((f) => (
                                    <FindingCard
                                        key={f.id}
                                        finding={f}
                                        expanded={expandedId === f.id}
                                        onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)}
                                        onReview={handleReview}
                                    />
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Risk */}
                    <Section
                        title="Risk Assessment"
                        count={riskFindings.length}
                        icon={<ShieldCheck className="h-4 w-4" style={{ color: "var(--accent-indigo)" }} />}
                        loading={riskRunning}
                    >
                        {riskFindings.length === 0 ? (
                            <EmptySection
                                text={riskRunning ? "Risk analysis in progress..." : 'No risks found. Click "Risk Analysis" to assess.'}
                            />
                        ) : (
                            <div className="space-y-3 stagger">
                                {riskFindings.map((f) => (
                                    <RiskCard
                                        key={f.id}
                                        finding={f}
                                        expanded={expandedId === f.id}
                                        onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)}
                                        onReview={handleReview}
                                    />
                                ))}
                            </div>
                        )}
                    </Section>
                </div>
            </div>
        </div>
    );
}

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({
    title, count, icon, children, loading,
}: {
    title: string; count: number; icon: React.ReactNode;
    children: React.ReactNode; loading?: boolean;
}) {
    return (
        <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div
                className="flex items-center justify-between px-6 py-3"
                style={{ background: "rgba(255,255,255,0.02)" }}
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                        {title}
                    </h2>
                    <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--bg-glass)", color: "var(--text-secondary)" }}
                    >
                        {count}
                    </span>
                </div>
                {loading && (
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--accent-indigo)" }}>
                        <Loader2 className="animate-spin h-3 w-3" /> Running...
                    </span>
                )}
            </div>
            <div className="px-6 py-4">{children}</div>
        </div>
    );
}

function EmptySection({ text }: { text: string }) {
    return (
        <p className="text-center py-8 text-xs" style={{ color: "var(--text-muted)" }}>
            {text}
        </p>
    );
}

/* ── Finding Card ─────────────────────────────────────────────── */
function FindingCard({
    finding: f, expanded, onToggle, onReview,
}: {
    finding: Finding; expanded: boolean;
    onToggle: () => void; onReview: (id: number, d: "APPROVE" | "OVERRIDE") => void;
}) {
    return (
        <div className={`finding-card ${f.status} animate-fade-in`}>
            <div className="flex items-start justify-between cursor-pointer" onClick={onToggle}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`badge ${SEVERITY_BADGE[f.severity] || "badge-pending"}`} style={{ fontSize: 10 }}>
                        {f.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                            {f.finding_type.replaceAll("_", " ")}
                        </h3>
                        {!expanded && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                {f.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                    <span className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{f.status}</span>
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                </div>
            </div>

            {expanded && (
                <div className="mt-3 animate-fade-in">
                    <p className="text-xs mb-3" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        {f.description}
                    </p>

                    {f.evidence?.variance_pct !== undefined && (
                        <div
                            className="rounded-lg p-3 mb-3 text-xs"
                            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)", color: "#fb7185" }}
                        >
                            Invoice: ${f.evidence.invoice_unit_price} → Contract: ${f.evidence.contract_agreed_rate} · +{f.evidence.variance_pct}% over
                        </div>
                    )}

                    {f.status === "open" && (
                        <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                            <button onClick={() => onReview(f.id, "APPROVE")} className="btn btn-success flex-1" style={{ fontSize: 11 }}>
                                <CheckCircle className="h-3 w-3" /> Confirm Issue
                            </button>
                            <button onClick={() => onReview(f.id, "OVERRIDE")} className="btn btn-secondary flex-1" style={{ fontSize: 11 }}>
                                <XCircle className="h-3 w-3" /> Override
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Risk Card ────────────────────────────────────────────────── */
function RiskCard({
    finding: f, expanded, onToggle, onReview,
}: {
    finding: Finding; expanded: boolean;
    onToggle: () => void; onReview: (id: number, d: "APPROVE" | "OVERRIDE") => void;
}) {
    const score = f.evidence?.risk_score;

    return (
        <div className={`finding-card ${f.status} animate-fade-in`} style={{ borderLeftColor: "var(--accent-indigo)" }}>
            <div className="flex items-start justify-between cursor-pointer" onClick={onToggle}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {score && (
                        <div
                            className="flex items-center justify-center rounded-lg font-bold text-xs"
                            style={{
                                width: 36, height: 36, minWidth: 36,
                                background: score >= 7 ? "rgba(244,63,94,0.12)" : score >= 4 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
                                color: score >= 7 ? "#fb7185" : score >= 4 ? "#fbbf24" : "#34d399",
                                border: `1px solid ${score >= 7 ? "rgba(244,63,94,0.2)" : score >= 4 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
                            }}
                        >
                            {score}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {f.finding_type}
                        </h3>
                        {!expanded && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                {f.description?.split("\n")[0]}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                    <span className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{f.status}</span>
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                </div>
            </div>

            {expanded && (
                <div className="mt-3 animate-fade-in">
                    <p className="text-xs mb-3 whitespace-pre-line" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        {f.description}
                    </p>

                    {f.evidence?.original && (
                        <div className="rounded-lg p-3 mb-2 text-xs" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                            <span className="block text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                                Original Clause
                            </span>
                            {f.evidence.original}
                        </div>
                    )}
                    {f.evidence?.redline && (
                        <div className="rounded-lg p-3 mb-2 text-xs" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", color: "#34d399" }}>
                            <span className="block text-[10px] font-bold tracking-wider uppercase mb-1">Suggested Redline</span>
                            {f.evidence.redline}
                        </div>
                    )}

                    {f.status === "open" && (
                        <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                            <button onClick={() => onReview(f.id, "APPROVE")} className="btn btn-success flex-1" style={{ fontSize: 11 }}>
                                <CheckCircle className="h-3 w-3" /> Accept Risk
                            </button>
                            <button onClick={() => onReview(f.id, "OVERRIDE")} className="btn btn-secondary flex-1" style={{ fontSize: 11 }}>
                                <XCircle className="h-3 w-3" /> Override
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
