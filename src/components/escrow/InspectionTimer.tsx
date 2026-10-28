"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { calculateInspectionTimer, InspectionTimerState } from "@/lib/escrow-engine";

interface InspectionTimerProps {
  inspectionEndAt?: string;
  onTimerExpire?: () => void;
  sticky?: boolean;
}

export function InspectionTimer({ inspectionEndAt, onTimerExpire, sticky = false }: InspectionTimerProps) {
  const [timerState, setTimerState] = useState<InspectionTimerState>(() =>
    calculateInspectionTimer(inspectionEndAt)
  );
  const expiredFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    const tick = () => {
      const updated = calculateInspectionTimer(inspectionEndAt);
      setTimerState(updated);
      if (updated.isExpired && inspectionEndAt && expiredFor.current !== inspectionEndAt) {
        expiredFor.current = inspectionEndAt;
        onTimerExpire?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [inspectionEndAt, onTimerExpire]);

  if (sticky) {
    return (
      <aside aria-label="Escrow Inspection Status" className="sticky top-20 z-30 w-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-cyan-500/40 px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timerState.isExpired ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${timerState.isExpired ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
            </span>
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              72-Hour Inspection Pulse:
            </span>
            <span className="text-xs text-slate-300">
              {timerState.isExpired
                ? "Inspection elapsed — funds eligible for auto-release"
                : "Buyer review window active before automated disbursement"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono text-sm font-black px-2.5 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              {timerState.formattedDisplay}
            </div>
            <a
              href="#inspection-details"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              Inspection Terms <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">
            72-Hour Inspection Protocol
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            timerState.isExpired
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-cyan-500/20 text-cyan-400 animate-pulse"
          }`}
        >
          {timerState.isExpired ? "Auto-Release Window" : "Inspection Clock Active"}
        </span>
      </div>

      <div className="py-3 text-center">
        <div className="font-mono text-3xl font-bold tracking-tight text-white">
          {timerState.formattedDisplay}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {timerState.isExpired
            ? "Inspection window elapsed without dispute. Funds are eligible for immediate automated release."
            : "Remaining for buyer to review deliverables or request revisions before funds auto-release."}
        </p>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Submitting revision requests pauses this clock immediately to protect freelancer effort.</span>
      </div>
    </div>
  );
}
