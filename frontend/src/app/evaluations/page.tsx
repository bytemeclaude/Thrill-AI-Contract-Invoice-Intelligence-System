"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Zap,
    LayoutDashboard,
    BarChart3,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EvaluationDashboard() {
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        fetch(`${API_URL}/evaluation/report`)
            .then((r) => r.json())
            .then(setReport)
            .catch(console.error);
    }, []);

    if (!report) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin h-8 w-8" style={{ color: "var(--accent-indigo)" }} />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Loading evaluation data... (Run eval_runner.py first)
                    </p>
                </div>
            </div>
        );
    }

    const { metrics, details, timestamp } = report;

    return (
        <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
            {/* Sidebar */}
            <aside className="sidebar animate-slide-in-left">
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
                                Contract<span className="gradient-text"> Intelligence</span>
                            </h1>
                            <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                                AI Audit Platform
                            </p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 py-4">
                    <p className="px-7 mb-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                        Menu
                    </p>
                    <Link href="/" className="sidebar-link">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link href="/evaluations" className="sidebar-link active">
                        <BarChart3 className="h-4 w-4" /> Evaluations
                    </Link>
                </nav>
                <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--gradient-brand)" }}>
                            CA
                        </div>
                        <div>
                            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Admin</p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Chartered Accountant</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-8" style={{ marginLeft: "var(--sidebar-width)" }}>
                <div className="mb-8 animate-fade-in">
                    <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                        Evaluation Dashboard
                    </h2>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        Run ID: {timestamp || "N/A"}
                    </p>
                </div>

                {/* Score Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
                    <ScoreGauge label="Extraction F1" value={metrics?.extraction_f1 || 0} target={0.9} color="var(--accent-indigo)" />
                    <ScoreGauge label="Mismatch Accuracy" value={metrics?.mismatch_accuracy || 0} target={0.8} color="var(--accent-cyan)" />
                    <ScoreGauge label="Risk Recall" value={metrics?.risk_recall || 0} target={0.95} color="var(--accent-emerald)" />
                </div>

                {/* Details Table */}
                <div className="glass-card overflow-hidden animate-slide-up">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Scenario</th>
                                <th>Extraction</th>
                                <th>Mismatch Detected</th>
                                <th>Expected Mismatch</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(details || []).map((d: any) => (
                                <tr key={d.scenario_id}>
                                    <td>
                                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                            Scenario {d.scenario_id}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className="badge"
                                            style={{
                                                background: d.extraction_score >= 0.9 ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
                                                color: d.extraction_score >= 0.9 ? "#34d399" : "#fb7185",
                                                borderColor: d.extraction_score >= 0.9 ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                                            }}
                                        >
                                            {d.extraction_score?.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>{d.found_mismatch ? "Yes" : "No"}</td>
                                    <td>{d.expected_mismatch ? "Yes" : "No"}</td>
                                    <td>
                                        {d.mismatch_correct ? (
                                            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#34d399" }}>
                                                <CheckCircle className="h-3.5 w-3.5" /> PASS
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#fb7185" }}>
                                                <XCircle className="h-3.5 w-3.5" /> FAIL
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!details || details.length === 0) && (
                        <div className="empty-state">
                            <BarChart3 className="h-12 w-12 mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                            <p className="text-sm font-medium mb-1">No evaluation data</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                Run eval_runner.py to generate evaluation results.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

/* ── Score Gauge ──────────────────────────────────────────────── */
function ScoreGauge({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
    const pct = Math.min(value * 100, 100);
    const isGood = value >= target;

    return (
        <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)" }}>
                {label}
            </h3>
            <div className="flex items-end gap-4">
                {/* Circular gauge */}
                <div className="relative" style={{ width: 72, height: 72 }}>
                    <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                        <circle cx="36" cy="36" r="30" fill="none" strokeWidth="5" stroke="var(--border-subtle)" />
                        <circle
                            cx="36" cy="36" r="30" fill="none" strokeWidth="5"
                            stroke={isGood ? color : "var(--accent-rose)"}
                            strokeDasharray={`${pct * 1.885} 188.5`}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dasharray 1s ease-out" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-extrabold" style={{ color: isGood ? color : "var(--accent-rose)" }}>
                            {value?.toFixed ? value.toFixed(2) : "0"}
                        </span>
                    </div>
                </div>
                <div className="mb-1">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Target: <span style={{ color: "var(--text-secondary)" }}>{target}</span>
                    </p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: isGood ? "#34d399" : "#fb7185" }}>
                        {isGood ? "✓ Passing" : "✗ Below Target"}
                    </p>
                </div>
            </div>
        </div>
    );
}
