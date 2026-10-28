"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, X, Info } from "lucide-react";
import { useKugiStore } from "@/lib/store";

export function AntiScamBanner() {
  const { antiScamAlertTriggered, lastScamWarning, dismissScamAlert } = useKugiStore();

  if (!antiScamAlertTriggered && !lastScamWarning) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 p-3 rounded-xl flex items-center justify-between text-xs mb-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Kugi Safety Tip:</strong> Keep payments and project records in Kugi so they are available when you need help resolving a dispute.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-slate-200 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs mb-3 shadow-md transition-all">
      <div className="flex items-start gap-2.5">
        <div className="p-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            Kugi Financial Safety Guidance
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed">
            {lastScamWarning ||
              "For your financial protection, keep payments and project records in Kugi. Review unexpected external payment requests before sending money, and use File Dispute if you need help."}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <Info className="w-3.5 h-3.5" />
            <span>RA 11967 supports consumer redress. Keep transaction records and use the platform dispute process; statutory rights still apply.</span>
          </div>
        </div>
      </div>

      <button
        onClick={dismissScamAlert}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        aria-label="Dismiss Alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
