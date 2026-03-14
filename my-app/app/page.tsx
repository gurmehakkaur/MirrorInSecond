"use client";
import { useState } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────────

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
const projects = [
  "Housing Service",
  "Rewards Service",
  "Careers Service",
  "Document Vault",
  "Offers",
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
          <span className="text-base font-semibold text-white">MirrorInSeconds.ai</span>
        </div>

        {/* Onboarded Projects */}
        <nav className="flex flex-col px-4">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Onboarded Projects
          </p>
          {projects.map((name) => (
            <button
              key={name}
              className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-[#2c2c48] hover:text-white"
            >
              {name}
            </button>
          ))}
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
