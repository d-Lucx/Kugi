"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Shield,
  MapPin,
  FileCheck2,
  Lock,
  Download,
  Trash2,
  Save,
  CheckCircle2,
  Smartphone,
  Building,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"payouts" | "security" | "clusters" | "privacy">("payouts");
  const [autoSweep, setAutoSweep] = useState(true);
  const [onSiteAvailable, setOnSiteAvailable] = useState(true);
  const [radiusKm, setRadiusKm] = useState(35);
  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">
          Account Settings &amp; Security Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your verified disbursement wallets, Davao del Norte operating zones, and BIR Form 2307 tax dossier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Vertical Navigation Sidebar (3 Cols) */}
        <div className="lg:col-span-3 space-y-1">
          <button
            onClick={() => setActiveTab("payouts")}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "payouts"
                ? "bg-navy text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Payout &amp; GCash Rails</span>
          </button>

          <button
            onClick={() => setActiveTab("clusters")}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "clusters"
                ? "bg-navy text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>DavNor Availability</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "security"
                ? "bg-navy text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security &amp; 2FA</span>
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "privacy"
                ? "bg-navy text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Tax &amp; Privacy (RA 10173)</span>
          </button>
        </div>

        {/* Main Content Area (9 Cols) */}
        <div className="lg:col-span-9 space-y-6">
          {savedAlert && (
            <div className="p-3 rounded-xl bg-emerald/15 border border-emerald text-emerald font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences successfully synchronized with Kugi ledger.</span>
            </div>
          )}

          {/* TAB 1: PAYOUTS */}
          {activeTab === "payouts" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-navy uppercase tracking-wider">
                Disbursement &amp; Milestone Escrow Payouts
              </h2>

              {/* Active GCash Payout */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    GCash
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-navy">GCash Mobile Wallet</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald text-white uppercase">
                        Default Payout
                      </span>
                    </div>
                    <div className="font-mono-currency text-xs text-slate-600 mt-0.5">
                      +63 917 *** 4921
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-emerald font-semibold">
                  Verified via PhilSys e-KYC
                </span>
              </div>

              {/* Auto-Sweep Toggle */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSweep}
                  onChange={(e) => setAutoSweep(e.target.checked)}
                  className="mt-1 text-cyan focus:ring-cyan rounded"
                />
                <div>
                  <span className="font-bold text-xs text-navy block">
                    Automatic Escrow Sweep
                  </span>
                  <span className="text-xs text-slate-500">
                    Automatically sweep cleared milestone escrow payouts to your connected GCash wallet upon buyer approval.
                  </span>
                </div>
              </label>

              {/* Secondary Payout Channels */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase">
                  Secondary Banking Rails (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800">Maya Business Wallet</span>
                    <span className="text-xs text-cyan font-bold">+ Link</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800">LandBank / UnionBank Account</span>
                    <span className="text-xs text-cyan font-bold">+ Link</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLUSTERS & AVAILABILITY */}
          {activeTab === "clusters" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-navy uppercase tracking-wider">
                Davao del Norte Regional Availability
              </h2>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onSiteAvailable}
                  onChange={(e) => setOnSiteAvailable(e.target.checked)}
                  className="mt-1 text-cyan focus:ring-cyan rounded"
                />
                <div>
                  <span className="font-bold text-xs text-navy block">
                    Open for On-Site Field Work within DavNor
                  </span>
                  <span className="text-xs text-slate-500">
                    Allows clients to book on-site architectural site inspections, packing plant cabling, or farm telemetry installations.
                  </span>
                </div>
              </label>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Operating Radius from Registered Barangay (Mankilam, Tagum)</span>
                  <span className="text-cyan font-mono-currency">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-cyan"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono-currency">
                  <span>5 km (Local Tagum)</span>
                  <span>60 km (Covers Panabo, Kapalong, Samal)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase block">
                  Active Regional Clusters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <input type="checkbox" defaultChecked className="text-cyan rounded" />
                    <span>Cluster 1: Tagum Core</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <input type="checkbox" defaultChecked className="text-cyan rounded" />
                    <span>Cluster 2: Kapalong / Asuncion</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <input type="checkbox" defaultChecked className="text-cyan rounded" />
                    <span>Cluster 3: Panabo Corridor</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <input type="checkbox" defaultChecked className="text-cyan rounded" />
                    <span>Cluster 4: Samal Island (IGaCoS)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-navy uppercase tracking-wider">
                Security &amp; Session Protection
              </h2>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-navy block">
                    Two-Factor Authentication (2FA)
                  </span>
                  <span className="text-xs text-slate-500">
                    Active via SMS OTP to +63 917 *** 4921
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald text-white text-[10px] font-bold uppercase">
                  Enabled
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase">
                  Active Logged-in Devices
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-navy">Chrome on Windows 11</div>
                      <div className="text-[10px] text-slate-400">Tagum City, Davao del Norte • Current Active Session</div>
                    </div>
                    <span className="text-[10px] text-emerald font-bold">This Device</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-navy">Kugi Android Mobile App</div>
                      <div className="text-[10px] text-slate-400">Panabo City, Davao del Norte • Active 2 hours ago</div>
                    </div>
                    <button className="text-[11px] text-crimson hover:underline font-semibold">
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TAX & PRIVACY */}
          {activeTab === "privacy" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-navy uppercase tracking-wider">
                BIR Form 2307 &amp; Data Privacy Rights (RA 10173)
              </h2>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-xs text-navy block">
                  Quarterly BIR Form 2307 Tax Withholding Dossier
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Under BIR RR 16-2023, digital platform operators withhold 0.5% Creditable Withholding Tax (CWT) on qualifying accounts. Open a contract workroom to review the tax estimate and prepare a draft Form 2307 dossier. Obtain the signed certificate from your withholding agent.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open Contracts for Tax Dossiers</span>
                  </Link>
                </div>
              </div>

              {/* Data Subject Rights (RA 10173) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="font-bold text-xs text-slate-700 uppercase block">
                  Data Subject Privacy Controls
                </span>
                <p className="text-xs text-slate-500">
                  You hold the legal right under the Philippine Data Privacy Act of 2012 to request an encrypted archive of your transaction history or request account erasure subject to mandatory 5-year tax record retention laws.
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => alert("Simulated data export downloaded.")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    Export My Data Archive (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Deletion request registered with Data Protection Officer.")}
                    className="text-xs text-crimson hover:underline font-semibold"
                  >
                    Request Account Erasure
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Save Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Changes apply across web and native mobile sessions.
            </span>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-cyan hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
