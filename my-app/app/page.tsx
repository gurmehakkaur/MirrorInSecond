"use client";
import { useState, useEffect } from "react";

const API = "/api";

type RoleCred = { email: string; password: string };

type Project = {
  _id: string;
  githubUrl: string;
  roles: string[];
  dbSchema: Record<string, string[]>;
  roleCredentials: Record<string, RoleCred>;
};

type Scenario = {
  _id: string;
  projectId: string;
  scenario: string;
  role: string;
  userId: string;
  userPassword: string;
  syntheticData: Record<string, unknown>;
  url: string;
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

const features = [
  { icon: "⚡", title: "Instant Sandboxes", desc: "Fresh environments from your exact source code and synthetic data." },
  { icon: "🎭", title: "Role-Based Scenarios", desc: "Simulate admins, reviewers, and end-users in the same flow." },
  { icon: "🧠", title: "Reusable Flows", desc: "Save workflows once, replay them across any environment." },
  { icon: "🔒", title: "Safe by Default", desc: "No real APIs, no real credentials. Fully sandboxed." },
];

const steps = ["Add your application", "Define scenarios", "Launch a sandbox", "Share the environment"];

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove, dim }: { label: string; onRemove?: () => void; dim?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={dim
        ? { backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE }
        : { backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}`, color: YELLOW }
      }
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-opacity hover:opacity-60"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ── ScenarioModal ─────────────────────────────────────────────────────────────
function ScenarioModal({
  project,
  onClose,
  onCreated,
}: {
  project: Project;
  onClose: () => void;
  onCreated: (scenario: Scenario) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [selectedRole, setSelectedRole] = useState(project.roles[0] || "user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MAX = 150;

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length > MAX) return;
    setLoading(true);
    setError("");
    try {
      // Step 1: generate synthetic data via AI
      const genRes = await fetch(`${API}/generatesyntheticdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          role: selectedRole,
          dbSchema: project.dbSchema,
          roleCredentials: project.roleCredentials || {},
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || "Generation failed");

      // Step 2: save scenario to DB
      const scenRes = await fetch(`${API}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project._id,
          scenario: prompt.trim(),
          role: selectedRole,
          userId: project.roleCredentials?.[selectedRole]?.email || "",
          userPassword: project.roleCredentials?.[selectedRole]?.password || "",
          syntheticData: genData.syntheticData,
          isLive: false,
        }),
      });
      const scenData = await scenRes.json();
      if (!scenRes.ok) throw new Error(scenData.error || "Failed to save scenario");

      onCreated(scenData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

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

        <div className="flex flex-col gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: YELLOW }}>Generate Scenario</p>
            <h2 className="text-xl font-black tracking-tight text-white">Describe the scenario to simulate.</h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>AI will generate schema-accurate synthetic data for this scenario.</p>
          </div>
        </div>

        {/* Role selector */}
        {project.roles.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Select Role</p>
            <div className="flex flex-wrap gap-2">
              {project.roles.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                  style={selectedRole === r
                    ? { backgroundColor: YELLOW, color: "#000" }
                    : { backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE }
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {project.roles.length === 1 && (
          <div className="flex gap-2">
            <Chip label={`Role: ${selectedRole}`} />
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE }}>
              {Object.keys(project.dbSchema).length} table{Object.keys(project.dbSchema).length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Textarea */}
        <div className="flex flex-col gap-1.5">
          <textarea
            autoFocus
            rows={3}
            maxLength={MAX}
            placeholder="e.g. Admin approves a pending housing application"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all leading-relaxed"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: "#fff" }}
            onFocus={e => { e.currentTarget.style.borderColor = YELLOW; e.currentTarget.style.boxShadow = `0 0 0 3px ${YELLOW_DIM}`; }}
            onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
          />
          <p className="text-right text-xs" style={{ color: prompt.length >= MAX ? "#ef4444" : MUTED }}>
            {prompt.length}/{MAX}
          </p>
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>{error}</p>}

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
            onClick={handleGenerate}
            disabled={!prompt.trim() || prompt.length > MAX || loading}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wide transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW, color: "#000", boxShadow: prompt.trim() ? `0 0 20px ${YELLOW}44` : "none" }}
          >
            {loading ? (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProjectDetailView ─────────────────────────────────────────────────────────
function ProjectDetailView({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedData, setExpandedData] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<{ id: string; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/scenarios?projectId=${project._id}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setScenarios(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [project._id]);

  const handleToggleLive = async (s: Scenario) => {
    setLaunchError(null);

    if (!s.isLive) {
      // ── Launch sandbox ────────────────────────────────────────────────────
      setLaunching(s._id);
      try {
        const launchRes = await fetch(`${API}/launchSandbox`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: project.githubUrl, syntheticData: s.syntheticData }),
        });
        const launchText = await launchRes.text();
        let launchData: { url?: string; error?: string; detail?: string } = {};
        try { launchData = JSON.parse(launchText); } catch { /* non-JSON body */ }
        if (!launchRes.ok) throw new Error(launchData.detail || launchData.error || launchText || "Launch failed");

        // Save url + isLive back to the scenario
        const patchRes = await fetch(`${API}/scenarios/${s._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLive: true, url: launchData.url }),
        });
        if (!patchRes.ok) throw new Error(`Failed to save scenario state (${patchRes.status})`);
        const updated = await patchRes.json();

        setScenarios(prev => prev.map(x => x._id === s._id ? updated : x));
      } catch (err: unknown) {
        setLaunchError({ id: s._id, msg: err instanceof Error ? err.message : "Launch failed" });
      } finally {
        setLaunching(null);
      }
    } else {
      // ── Take offline ──────────────────────────────────────────────────────
      const updated = await fetch(`${API}/scenarios/${s._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: false }),
      }).then(r => r.json());
      setScenarios(prev => prev.map(x => x._id === s._id ? updated : x));
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/scenarios/${id}`, { method: "DELETE" });
    setScenarios(prev => prev.filter(s => s._id !== id));
  };

  const repoName = project.githubUrl.split("/").pop() || project.githubUrl;
  const tableCount = Object.keys(project.dbSchema).length;

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
        All Applications
      </button>

      {/* Header */}
      <div className="flex items-start justify-between pb-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: YELLOW }}>Scenarios</p>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">{repoName}</h1>
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs transition-opacity hover:opacity-70" style={{ color: SUBTLE }}>
            {project.githubUrl}
          </a>
          <div className="flex flex-wrap gap-2 mt-4">
            {project.roles.map(r => <Chip key={r} label={r} />)}
            <Chip label={`${tableCount} table${tableCount !== 1 ? "s" : ""}`} dim />
          </div>

          {/* Role credentials */}
          {project.roleCredentials && Object.keys(project.roleCredentials).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(project.roleCredentials).map(([role, cred]) => (
                <div
                  key={role}
                  className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: YELLOW }}>{role}</span>
                  <span className="text-xs font-mono" style={{ color: SUBTLE }}>{cred.email}</span>
                  <span className="text-xs font-mono" style={{ color: MUTED }}>{cred.password}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-black uppercase tracking-wide transition-all flex-shrink-0"
          style={{ backgroundColor: YELLOW, color: "#000", boxShadow: `0 0 24px ${YELLOW_BORDER}` }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 40px ${YELLOW}55`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 24px ${YELLOW_BORDER}`)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate New Scenario
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <ScenarioModal
          project={project}
          onClose={() => setShowModal(false)}
          onCreated={(scenario) => {
            setScenarios(prev => [scenario, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      {/* Scenarios list */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Saved Scenarios</p>
          <span className="rounded-full px-3 py-0.5 text-xs font-semibold" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE }}>
            {scenarios.length} total
          </span>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading...</p>
        ) : scenarios.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16 gap-3"
            style={{ border: `1px dashed ${BORDER}` }}
          >
            <p className="text-sm font-semibold text-white">No scenarios yet</p>
            <p className="text-xs" style={{ color: MUTED }}>Click Generate New Scenario to create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {scenarios.map((s) => (
              <div
                key={s._id}
                className="flex flex-col rounded-2xl overflow-hidden transition-all"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = YELLOW_BORDER; e.currentTarget.style.boxShadow = `0 0 20px ${YELLOW_DIM}`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
                  <button
                    onClick={() => handleToggleLive(s)}
                    disabled={launching === s._id}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={s.isLive
                      ? { backgroundColor: "#00d4aa18", color: "#00d4aa" }
                      : launching === s._id
                        ? { backgroundColor: YELLOW_DIM, color: YELLOW }
                        : { backgroundColor: "#ffffff10", color: MUTED }
                    }
                    title={s.isLive ? "Click to take offline" : "Click to launch sandbox"}
                  >
                    {launching === s._id ? (
                      <>
                        <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Launching…
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.isLive ? "#00d4aa" : MUTED }} />
                        {s.isLive ? "Live" : "Offline"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
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

                {/* Scenario description */}
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MUTED }}>Scenario</p>
                  <p className="text-xs font-bold text-white">{s.scenario || "—"}</p>
                </div>

                {/* URL */}
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MUTED }}>Hosted URL</p>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="truncate block text-xs font-medium transition-opacity hover:opacity-70" style={{ color: YELLOW }}>{s.url}</a>
                  ) : (
                    <p className="text-xs" style={{ color: MUTED }}>Not deployed yet</p>
                  )}
                </div>

                {/* Role */}
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: MUTED }}>Role</p>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}`, color: YELLOW }}>
                    {s.role || "—"}
                  </span>
                </div>

                {/* User ID */}
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MUTED }}>User ID</p>
                  <p className="text-xs" style={{ color: SUBTLE }}>{s.userId || "—"}</p>
                </div>

                {/* Password */}
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: MUTED }}>Password</p>
                  <p className="text-xs font-mono tracking-widest" style={{ color: SUBTLE }}>{s.userPassword ? "••••••••••" : "—"}</p>
                </div>

                {/* Launch error */}
                {launchError?.id === s._id && (
                  <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <p className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>
                      Launch failed: {launchError.msg}
                    </p>
                  </div>
                )}

                {/* Synthetic Data toggle */}
                <div className="px-4 py-2.5">
                  <button
                    onClick={() => setExpandedData(expandedData === s._id ? null : s._id)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Synthetic Data</p>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedData === s._id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedData === s._id && (
                    <pre className="mt-2 text-[10px] leading-relaxed overflow-auto rounded-lg p-2 max-h-36" style={{ backgroundColor: SURFACE, color: SUBTLE }}>
                      {JSON.stringify(s.syntheticData, null, 2)}
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

// ── NewApplicationView ────────────────────────────────────────────────────────
type TableEntry = { id: string; name: string; jsonPayload: string };

function NewApplicationView({
  onBack,
  projects,
  setProjects,
  loading,
  onSelectProject,
}: {
  onBack: () => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loading: boolean;
  onSelectProject: (project: Project) => void;
}) {
  const [githubUrl, setGithubUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [tables, setTables] = useState<TableEntry[]>([{ id: "1", name: "", jsonPayload: "" }]);

  const addRole = () => {
    const r = roleInput.trim().toLowerCase();
    if (r && !roles.includes(r)) setRoles(prev => [...prev, r]);
    setRoleInput("");
  };

  const addTable = () =>
    setTables(prev => [...prev, { id: `${Date.now()}`, name: "", jsonPayload: "" }]);

  const updateTable = (id: string, patch: Partial<TableEntry>) =>
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const removeTable = (id: string) =>
    setTables(prev => prev.filter(t => t.id !== id));

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${API}/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p._id !== id));
  };

  const handleSubmit = async () => {
    if (!githubUrl.trim()) return;
    const dbSchemaObj: Record<string, string[]> = {};
    tables.forEach(t => {
      if (!t.name.trim()) return;
      try {
        const parsed = JSON.parse(t.jsonPayload);
        const sample = Array.isArray(parsed) ? parsed[0] : parsed;
        dbSchemaObj[t.name.trim()] = (sample && typeof sample === "object") ? Object.keys(sample) : [];
      } catch {
        dbSchemaObj[t.name.trim()] = [];
      }
    });

    const created = await fetch(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        githubUrl: githubUrl.trim(),
        roles: roles.length > 0 ? roles : ["user"],
        dbSchema: dbSchemaObj,
      }),
    }).then(r => r.json());

    setProjects(prev => [created, ...prev]);
    setSubmitted(true);
    setGithubUrl("");
    setRoles([]);
    setTables([{ id: "1", name: "", jsonPayload: "" }]);
    setTimeout(() => setSubmitted(false), 3000);
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
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: YELLOW }}>Applications</p>
        <h1 className="text-3xl font-black tracking-tight text-white">Onboard a new application.</h1>
        <p className="mt-2 text-sm" style={{ color: SUBTLE }}>Connect a GitHub repo, define roles, and map your schema. Once added, you can generate scenarios.</p>
      </div>

      {/* Form card */}
      <div className="flex flex-col gap-6 rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 0 30px ${YELLOW_DIM}` }}>

        {/* GitHub URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            GitHub Repository URL
          </label>
          <div className="relative">
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
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        {/* Roles */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: MUTED }}>Roles</label>
          <p className="text-xs mb-3" style={{ color: SUBTLE }}>Who can log into this environment (e.g. admin, user, reviewer)</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g. admin"
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRole(); } }}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: "#fff" }}
              onFocus={e => { e.currentTarget.style.borderColor = YELLOW; e.currentTarget.style.boxShadow = `0 0 0 3px ${YELLOW_DIM}`; }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              onClick={addRole}
              disabled={!roleInput.trim()}
              className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-25"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: YELLOW }}
              onMouseEnter={e => { if (roleInput.trim()) e.currentTarget.style.borderColor = YELLOW; }}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              + Add
            </button>
          </div>
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {roles.map(r => <Chip key={r} label={r} onRemove={() => setRoles(prev => prev.filter(x => x !== r))} />)}
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        {/* Database Schema */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: MUTED }}>Database Schema</label>
          <p className="text-xs mb-4" style={{ color: SUBTLE }}>Paste a sample JSON payload for each table. Fields are extracted automatically.</p>

          <div className="flex flex-col gap-3">
            {tables.map((t, i) => (
              <div key={t.id} className="flex flex-col gap-2 rounded-xl p-4" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest w-4 text-center flex-shrink-0" style={{ color: MUTED }}>{i + 1}</span>
                  <input
                    type="text"
                    placeholder="Table name (e.g. users)"
                    value={t.name}
                    onChange={e => updateTable(t.id, { name: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none transition-all"
                    style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
                    onFocus={e => { e.currentTarget.style.borderColor = YELLOW; }}
                    onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
                  />
                  {tables.length > 1 && (
                    <button
                      onClick={() => removeTable(t.id)}
                      className="flex items-center justify-center h-6 w-6 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: MUTED }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  placeholder={`Paste sample JSON (e.g. {"id":1,"email":"alice@example.com","role":"admin"})`}
                  value={t.jsonPayload}
                  onChange={e => updateTable(t.id, { jsonPayload: e.target.value })}
                  className="w-full rounded-lg px-3 py-2.5 text-xs font-mono resize-none outline-none transition-all leading-relaxed"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: SUBTLE }}
                  onFocus={e => { e.currentTarget.style.borderColor = MUTED; e.currentTarget.style.color = "#fff"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = SUBTLE; }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={addTable}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold transition-colors"
            style={{ color: MUTED }}
            onMouseEnter={e => (e.currentTarget.style.color = YELLOW)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another table
          </button>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        {/* Submit */}
        <div className="flex items-center justify-between">
          {submitted ? (
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: YELLOW }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Application added. Click it below to start generating scenarios.
            </div>
          ) : (
            <p className="text-xs" style={{ color: MUTED }}>After adding, click the application to start generating scenarios.</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!githubUrl.trim()}
            className="rounded-xl px-6 py-2.5 text-sm font-black transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW, color: "#000" }}
          >
            Add Application
          </button>
        </div>
      </div>

      {/* Applications grid */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Your Applications</p>
          <span className="rounded-full px-3 py-0.5 text-xs font-semibold" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: SUBTLE }}>
            {projects.length} total
          </span>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading...</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-16 gap-3" style={{ border: `1px dashed ${BORDER}` }}>
            <p className="text-sm font-semibold text-white">No applications yet</p>
            <p className="text-xs" style={{ color: MUTED }}>Add your first application above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {projects.map((p) => {
              const repo = p.githubUrl.split("/").pop() || p.githubUrl;
              const org = p.githubUrl.split("/").slice(-2, -1)[0] || "";
              const tables = Object.keys(p.dbSchema || {});
              return (
                <div
                  key={p._id}
                  onClick={() => onSelectProject(p)}
                  className="flex flex-col rounded-2xl overflow-hidden transition-all cursor-pointer"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = YELLOW_BORDER; e.currentTarget.style.boxShadow = `0 0 20px ${YELLOW_DIM}`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
                    <span className="text-xs font-semibold" style={{ color: SUBTLE }}>{org || "github"}</span>
                    <button
                      onClick={(e) => handleDelete(p._id, e)}
                      className="flex items-center justify-center h-6 w-6 rounded-lg transition-colors"
                      style={{ color: MUTED }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                      title="Delete application"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>

                  {/* Repo name */}
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-base font-black text-white mb-0.5">{repo}</p>
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] transition-opacity hover:opacity-70 truncate block"
                      style={{ color: SUBTLE }}
                    >
                      {p.githubUrl}
                    </a>
                  </div>

                  {/* Roles */}
                  <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {(p.roles || []).map(r => (
                        <span key={r} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}`, color: YELLOW }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Schema */}
                  <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: MUTED }}>Schema</p>
                    <p className="text-xs" style={{ color: SUBTLE }}>
                      {tables.length > 0 ? tables.join(", ") : "—"}
                    </p>
                  </div>

                  {/* Role Credentials */}
                  {p.roleCredentials && Object.keys(p.roleCredentials).length > 0 && (
                    <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>Test Credentials</p>
                      <div className="flex flex-col gap-1.5">
                        {Object.entries(p.roleCredentials).map(([role, cred]) => (
                          <div key={role} className="rounded-lg px-2.5 py-2" style={{ backgroundColor: SURFACE }}>
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: YELLOW }}>{role}</span>
                            <p className="text-[10px] mt-0.5 font-mono" style={{ color: SUBTLE }}>{cred.email}</p>
                            <p className="text-[10px] font-mono" style={{ color: MUTED }}>{cred.password}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="px-4 py-3 mt-auto" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold uppercase tracking-wide transition-all"
                      style={{ backgroundColor: YELLOW_DIM, border: `1px solid ${YELLOW_BORDER}`, color: YELLOW }}
                    >
                      View Scenarios
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<"home" | "new-app" | "project-detail">("home");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/projects`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setProjects(data); setProjectsLoading(false); } })
      .catch(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setView("project-detail");
  };

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

        <nav className="flex flex-col px-3 pt-4 gap-0.5 overflow-y-auto">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Applications</p>
          {projectsLoading ? (
            <p className="px-3 py-2 text-xs" style={{ color: MUTED }}>Loading...</p>
          ) : projects.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: MUTED }}>No apps yet</p>
          ) : (
            projects.map((p) => (
              <button
                key={p._id}
                onClick={() => handleSelectProject(p)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all"
                style={{
                  color: selectedProject?._id === p._id ? "#fff" : SUBTLE,
                  backgroundColor: selectedProject?._id === p._id ? CARD : "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = CARD; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = selectedProject?._id === p._id ? CARD : "transparent";
                  e.currentTarget.style.color = selectedProject?._id === p._id ? "#fff" : SUBTLE;
                }}
              >
                {p.githubUrl.split("/").pop() || "untitled"}
              </button>
            ))
          )}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: BG }}>

        {view === "home" && (
          <div className="flex flex-col">

            {/* ── Hero ── */}
            <div
              className="relative flex flex-col px-16 py-20 gap-7 overflow-hidden"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
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
                    <span className="flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: YELLOW }}>
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
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Application
                </button>
                <button
                  className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wide transition-all"
                  style={{ backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: SUBTLE }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = MUTED; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = SUBTLE; }}
                >
                  View Docs →
                </button>
              </div>
              <p className="text-xs font-medium" style={{ color: MUTED }}>
                Paste a GitHub repository and generate reusable testing environments.
              </p>
              <div className="flex rounded-2xl overflow-hidden mt-4" style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD }}>
                {steps.map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 px-6 py-4 flex-1 transition-all"
                    style={{ borderRight: i < steps.length - 1 ? `1px solid ${BORDER}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = SURFACE)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black flex-shrink-0" style={{ backgroundColor: YELLOW, color: "#000" }}>
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
                    onMouseEnter={e => { e.currentTarget.style.borderColor = YELLOW_BORDER; e.currentTarget.style.boxShadow = `0 0 20px ${YELLOW_DIM}`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
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
            <div className="flex items-center justify-center px-16 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-xs font-medium" style={{ color: MUTED }}>
                Built for teams that need reliable demos and repeatable QA.
              </p>
            </div>
          </div>
        )}

        {view === "new-app" && (
          <NewApplicationView
            onBack={() => setView("home")}
            projects={projects}
            setProjects={setProjects}
            loading={projectsLoading}
            onSelectProject={handleSelectProject}
          />
        )}

        {view === "project-detail" && selectedProject && (
          <ProjectDetailView
            project={selectedProject}
            onBack={() => setView("new-app")}
          />
        )}
      </main>
    </div>
  );
}
