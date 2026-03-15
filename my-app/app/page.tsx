"use client";
import { useState, useEffect } from "react";

const API = "/api";

type Project = {
  _id: string;
  scenario: string;
  githubUrl: string;
  syntheticData: Record<string, unknown>;
  role: string;
  userId: string;
  userPassword: string;
  isLive: boolean;
};

const YELLOW = "#e8d84b";
const YELLOW_DIM = "#e8d84b22";
const YELLOW_BORDER = "#e8d84b44";
const BG = "#0e0e0e";
const SURFACE = "#141414";
const CARD = "#181818";
const BORDER = "#252525";
const MUTED = "#555";
const SUBTLE = "#888";

const projects = ["Housing Service", "Rewards Service", "Careers Service", "Document Vault", "Offers"];

const features = [
  { icon: "⚡", title: "Instant Sandboxes", desc: "Fresh environments from your exact source code and synthetic data." },
  { icon: "🎭", title: "Role-Based Scenarios", desc: "Simulate admins, reviewers, and end-users in the same flow." },
  { icon: "🧠", title: "Reusable Flows", desc: "Save workflows once, replay them across any environment." },
  { icon: "🔒", title: "Safe by Default", desc: "No real APIs, no real credentials. Fully sandboxed." },
];

const steps = ["Add your application", "Define scenarios", "Launch a sandbox", "Share the environment"];

// ── New Application View ───────────────────────────────────────────────────────
function ScenarioModal({ onClose, onLaunch }: { onClose: () => void; onLaunch: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative flex flex-col gap-6 rounded-2xl p-8 w-full max-w-lg"
        style={{
          backgroundColor: CARD,
          border: `1px solid ${YELLOW_BORDER}`,
          boxShadow: `0 0 60px ${YELLOW}22, 0 25px 50px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ color: MUTED }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon + heading */}
        <div className="flex flex-col gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: YELLOW }}>Spin Up New Version</p>
            <h2 className="text-xl font-black tracking-tight text-white">What scenario do you want to spin up?</h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>Describe the test scenario and we'll generate the environment.</p>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          autoFocus
          rows={4}
          placeholder="e.g. Log in as an admin and approve a pending housing application with synthetic tenant data"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all leading-relaxed"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            color: "#fff",
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = YELLOW;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${YELLOW_DIM}`;
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = BORDER;
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm font-semibold transition-colors"
            style={{ color: MUTED }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (prompt.trim()) onLaunch(prompt); }}
            disabled={!prompt.trim()}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wide transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW, color: "#000", boxShadow: prompt.trim() ? `0 0 20px ${YELLOW}44` : "none" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Launch
          </button>
        </div>
      </div>
    </div>
  );
}

function NewApplicationView({ onBack }: { onBack: () => void }) {
  const [githubUrl, setGithubUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedData, setExpandedData] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/projects`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setProjects(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`${API}/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p._id !== id));
  };

  const handleToggleLive = async (p: Project) => {
    const updated = await fetch(`${API}/projects/${p._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLive: !p.isLive }),
    }).then(r => r.json());
    setProjects(prev => prev.map(x => x._id === p._id ? updated : x));
  };

  const handleSubmitRepo = async () => {
    if (!githubUrl.trim()) return;
    const created = await fetch(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: "New Scenario", githubUrl, syntheticData: {}, role: "user", userId: "", userPassword: "", isLive: false }),
    }).then(r => r.json());
    setProjects(prev => [...prev, created]);
    setSubmitted(true);
  };

  return (
    <div
      className="flex flex-col gap-8 px-12 py-10 min-h-full"
      style={{ backgroundColor: BG, fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 w-fit text-sm font-medium transition-colors"
        style={{ color: MUTED }}
        onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: "1.5rem" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: YELLOW }}>New Application</p>
        <h1 className="text-3xl font-black tracking-tight text-white">Connect a repository.</h1>
        <p className="mt-2 text-sm" style={{ color: SUBTLE }}>Paste a GitHub URL to spin up a mirrored environment in seconds.</p>
      </div>

      {/* GitHub input card */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 0 30px ${YELLOW_DIM}` }}>
        <label className="block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: MUTED }}>
          GitHub Repository URL
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            <input
              type="url"
              placeholder="https://github.com/your-org/your-repo"
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: "#fff" }}
              onFocus={e => { e.currentTarget.style.borderColor = YELLOW; e.currentTarget.style.boxShadow = `0 0 0 3px ${YELLOW_DIM}`; }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <button
            onClick={handleSubmitRepo}
            disabled={!githubUrl.trim()}
            className="rounded-xl px-6 py-3 text-sm font-black transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW, color: "#000" }}
          >
            Submit
          </button>
        </div>
        {submitted && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold" style={{ color: YELLOW }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Repo linked successfully.
          </div>
        )}
      </div>

      {/* Spin up */}
      {showModal && (
        <ScenarioModal
          onClose={() => setShowModal(false)}
          onLaunch={(prompt) => { console.log("Launching:", prompt); setShowModal(false); }}
        />
      )}
      <div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-black tracking-wide uppercase transition-all"
          style={{ backgroundColor: YELLOW, color: "#000", boxShadow: `0 0 24px ${YELLOW_BORDER}` }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 40px ${YELLOW}55`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 24px ${YELLOW_BORDER}`)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Spin Up New Version
        </button>
      </div>

      {/* Projects list */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Environments</p>
          <span className="rounded-full px-3 py-0.5 text-xs font-semibold" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE }}>
            {projects.length} total
          </span>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>No environments yet. Submit a repo above.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p._id}
                className="flex flex-col rounded-2xl overflow-hidden transition-all"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = YELLOW_BORDER; e.currentTarget.style.boxShadow = `0 0 20px ${YELLOW_DIM}`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
                  {/* Live toggle */}
                  <button
                    onClick={() => handleToggleLive(p)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide transition-all"
                    style={p.isLive
                      ? { backgroundColor: "#00d4aa18", color: "#00d4aa" }
                      : { backgroundColor: "#ffffff10", color: MUTED }
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.isLive ? "#00d4aa" : MUTED }} />
                    {p.isLive ? "Live" : "Offline"}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="flex items-center justify-center h-6 w-6 rounded-lg transition-colors"
                    style={{ color: MUTED }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                    title="Delete"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>

                {/* Fields */}
                {[
                  { label: "Scenario", value: p.scenario, bold: true },
                  { label: "GitHub URL", value: p.githubUrl, link: true },
                  { label: "Role", value: p.role },
                  { label: "User ID", value: p.userId },
                  { label: "Password", value: p.userPassword, password: true },
                ].map(({ label, value, bold, link, password }, fi) => (
                  <div key={label} className="px-4 py-2.5" style={{ borderBottom: fi < 4 ? `1px solid ${BORDER}` : "none" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MUTED }}>{label}</p>
                    {link ? (
                      <a href={value} target="_blank" rel="noopener noreferrer" className="truncate block text-xs font-medium transition-opacity hover:opacity-70" style={{ color: YELLOW }}>{value || "—"}</a>
                    ) : password ? (
                      <p className="text-xs font-mono tracking-widest" style={{ color: SUBTLE }}>{value ? "••••••••••" : "—"}</p>
                    ) : (
                      <p className="text-xs" style={{ color: bold ? "#fff" : SUBTLE, fontWeight: bold ? 700 : 400 }}>{value || "—"}</p>
                    )}
                  </div>
                ))}

                {/* Synthetic Data toggle */}
                <div className="px-4 py-2.5">
                  <button
                    onClick={() => setExpandedData(expandedData === p._id ? null : p._id)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Synthetic Data</p>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedData === p._id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedData === p._id && (
                    <pre className="mt-2 text-[10px] leading-relaxed overflow-auto rounded-lg p-2 max-h-36" style={{ backgroundColor: SURFACE, color: SUBTLE }}>
                      {JSON.stringify(p.syntheticData, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<"home" | "new-app">("home");

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif", backgroundColor: BG }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="flex w-56 flex-shrink-0 flex-col py-5"
        style={{ backgroundColor: SURFACE, borderRight: `1px solid ${BORDER}` }}
      >
        <div
          className="flex items-center gap-2.5 px-5 pb-5"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black flex-shrink-0"
            style={{ backgroundColor: YELLOW, color: "#000" }}
          >
            M
          </div>
          <span className="text-sm font-bold text-white">MirrorInSeconds</span>
        </div>

        <nav className="flex flex-col px-3 pt-4 gap-0.5">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Projects</p>
          {projects.map((name) => (
            <button
              key={name}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all"
              style={{ color: SUBTLE }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = CARD;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = SUBTLE;
              }}
            >
              {name}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: BG }}>

        {view === "home" ? (
          <div className="flex flex-col">

            {/* ── Hero ── */}
            <div
              className="relative flex flex-col px-16 py-20 gap-7 overflow-hidden"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              {/* Subtle yellow glow top-left */}
              <div
                className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full"
                style={{ background: `radial-gradient(circle, ${YELLOW}12 0%, transparent 70%)` }}
              />

              <span
                className="w-fit rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}`, color: YELLOW }}
              >
                AI-Powered Environment Mirroring
              </span>

              <h1 className="text-[3.5rem] font-black leading-[1.05] tracking-tight text-white max-w-2xl">
                Mirror your app.<br />
                Test without risk.<br />
                <span style={{ color: YELLOW }}>In seconds.</span>
              </h1>

              <div className="flex flex-col gap-2.5">
                {[
                  "Synthetic data — no prod data or APIs touched",
                  "Log in as admin or user — all roles available",
                  "Reusable flows — save once, replay everywhere",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0"
                      style={{ backgroundColor: YELLOW }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-sm" style={{ color: SUBTLE }}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("new-app")}
                  className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-black uppercase tracking-wide transition-all"
                  style={{ backgroundColor: YELLOW, color: "#000", boxShadow: `0 0 30px ${YELLOW}44` }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 50px ${YELLOW}66`)}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 30px ${YELLOW}44`)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Application
                </button>
                <button
                  className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide transition-all"
                  style={{ backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: SUBTLE }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = MUTED;
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.color = SUBTLE;
                  }}
                >
                  View Docs →
                </button>
              </div>

              <p className="text-xs font-medium" style={{ color: MUTED }}>
                Paste a GitHub repository and generate reusable testing environments.
              </p>

              {/* Steps row at bottom of hero */}
              <div
                className="flex rounded-2xl overflow-hidden mt-4"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD }}
              >
                {steps.map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 px-6 py-4 flex-1 transition-all"
                    style={{ borderRight: i < steps.length - 1 ? `1px solid ${BORDER}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = SURFACE)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: YELLOW, color: "#000" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-white leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Feature Highlights ── */}
            <div className="px-16 py-14" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-10" style={{ color: MUTED }}>Feature Highlights</p>
              <div className="grid grid-cols-4 gap-4 max-w-4xl">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="flex flex-col gap-4 rounded-2xl p-5 transition-all cursor-default"
                    style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = YELLOW_BORDER;
                      e.currentTarget.style.boxShadow = `0 0 20px ${YELLOW_DIM}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = BORDER;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1.5">{f.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: SUBTLE }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Footer ── */}
            <div
              className="flex items-center justify-center px-16 py-5"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <p className="text-xs font-medium" style={{ color: MUTED }}>
                Built for teams that need reliable demos and repeatable QA.
              </p>
            </div>

          </div>
        ) : (
          <NewApplicationView onBack={() => setView("home")} />
        )}
      </main>
    </div>
  );
}
