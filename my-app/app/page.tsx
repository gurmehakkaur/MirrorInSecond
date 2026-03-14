"use client";
import { useState } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const FlagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="18" height="12" rx="1" /><path d="M3 10L12 3l9 7" />
    <rect x="9" y="14" width="6" height="8" />
  </svg>
);
const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" rx="1" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const BriefcaseNavIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12" strokeWidth="4" />
    <path d="M2 12h20" />
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Card icons (larger)
const BriefcaseCardIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12" strokeWidth="3" />
    <path d="M2 12h20" />
  </svg>
);
const UploadCardIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ── Nav items ──────────────────────────────────────────────────────────────────
const navItems = [
  { icon: <HomeIcon />, label: "Home", highlight: "blue" },
  { icon: <GridIcon />, label: "Applications" },
  { icon: <ShieldIcon />, label: "Document Vault" },
  { icon: <FlagIcon />, label: "Express Entry" },
  { icon: <SparkleIcon />, label: "Offers & Benefits", selected: true },
  { icon: <BuildingIcon />, label: "Housing" },
  { icon: <GiftIcon />, label: "Rewards" },
  { icon: <CalendarIcon />, label: "Consult a Lawyer" },
  { icon: <FileIcon />, label: "Resources" },
  { icon: <BriefcaseNavIcon />, label: "Careers" },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [bannerOpen, setBannerOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex w-56 flex-shrink-0 flex-col py-4"
        style={{ backgroundColor: "#1b1b2f" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <div className="flex gap-1">
            <div className="h-4 w-4 rounded-sm bg-white opacity-90" />
            <div className="h-4 w-4 rounded-full bg-white opacity-90" />
            <div className="h-4 w-4 rounded-full bg-white opacity-90" />
          </div>
          <span className="text-base font-semibold text-white">BorderPass</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-left transition-colors
                ${item.highlight === "blue"
                  ? "text-[#4A90D9]"
                  : item.selected
                  ? "bg-[#2c2c48] text-white"
                  : "text-gray-400 hover:bg-[#2c2c48] hover:text-white"
                }`}
            >
              <span className={item.highlight === "blue" ? "text-[#4A90D9]" : item.selected ? "text-white" : "text-gray-500"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}

          {/* Profile with red dot */}
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-400 text-left hover:bg-[#2c2c48] hover:text-white transition-colors">
            <span className="relative text-gray-500">
              <UserIcon />
              <span
                className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"
                style={{ border: "2px solid #1b1b2f" }}
              />
            </span>
            Profile
          </button>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: "#efefef" }}>

        {/* Yellow announcement banner */}
        {bannerOpen && (
          <div
            className="mx-4 mt-4 flex items-center justify-between rounded px-5 py-3"
            style={{ backgroundColor: "#d9e84a" }}
          >
            <p className="text-sm font-medium text-gray-900">
              Join Our Webinars. Live Q&amp;A with lawyers and experts.
            </p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 rounded border border-gray-800 bg-transparent px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white transition-colors">
                Register &rarr;
              </button>
              <button
                onClick={() => setBannerOpen(false)}
                className="text-base text-gray-700 hover:text-gray-900 leading-none"
                aria-label="Close banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Inner content padding */}
        <div className="flex flex-col gap-6 px-8 py-6">

          {/* Product Tour button */}
          <div>
            <button className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors">
              Start Product Tour ✨
            </button>
          </div>

          {/* Two cards */}
          <div className="flex gap-6">

            {/* Application Hub */}
            <div className="flex flex-1 flex-col rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="mt-1 flex-shrink-0">
                  <BriefcaseCardIcon />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">Application Hub</h2>
                  <p className="text-sm leading-relaxed text-gray-500">
                    Apply to study, work, build a pathway to permanent residence, and more
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <button className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                  View your applications
                </button>
              </div>
            </div>

            {/* Upload Study Permit */}
            <div
              className="flex flex-1 flex-col rounded-2xl p-8 shadow-sm"
              style={{ backgroundColor: "#6ecfc4" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="mt-1 flex-shrink-0">
                  <UploadCardIcon />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">Upload Your Study Permit</h2>
                  <p className="text-sm leading-relaxed text-gray-800">
                    Uploading keeps your documents in one place and allows BorderPass to provide guidance that fits your situation.
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <button className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                  Upload Your Study Permit
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Floating bottom-right buttons */}
        <div className="fixed bottom-5 right-5 flex gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors text-sm font-bold italic">
            i
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 9a3 3 0 1 1 4 2.83V13M12 17h.01" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
