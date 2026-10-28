"use client";

import React, { useState, useRef, useEffect } from "react";
import { Receipt, FileText, Download, Info, X } from "lucide-react";
import { formatCurrency, calculateTaxWithholding } from "@/lib/tax-calculator";

interface BirTaxBreakdownModalProps {
  grossAmount: number;
  freelancerName?: string;
  tinNumber?: string;
}

export function BirTaxBreakdownModal({
  grossAmount,
  freelancerName = "",
  tinNumber = "",
}: BirTaxBreakdownModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const taxSummary = calculateTaxWithholding(grossAmount);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [payeeName, setPayeeName] = useState(freelancerName);
  const [payeeTin, setPayeeTin] = useState(tinNumber);
  const downloadParams = new URLSearchParams({
    amount: String(grossAmount), payee: payeeName, tin: payeeTin,
  });
  const canDownload = Boolean(payeeName.trim() && /^\d{3}-\d{3}-\d{3}-\d{3,5}$/.test(payeeTin));

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 min-h-[44px] px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
      >
        <Receipt className="w-3.5 h-3.5" />
        <span>View BIR RR 16-2023 Tax Breakdown</span>
      </button>

        <dialog ref={dialogRef} onClose={() => setIsOpen(false)} aria-labelledby="bir-tax-title" className="m-auto p-4 bg-transparent max-w-xl w-full max-h-[90dvh] overflow-y-auto backdrop:bg-slate-900/70 backdrop:backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="bir-tax-title" className="text-base font-bold text-slate-900 dark:text-white">
                    BIR RR 16-2023 Withholding Tax
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    RDO 112 • Tagum City, Davao del Norte
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span>Gross Project Value:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(grossAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-xs">
                  <span>Tax Base (50% under RR 16-2023):</span>
                  <span>{formatCurrency(grossAmount * 0.5)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <span>Creditable Withholding Tax (1% on 50% = 0.5%):</span>
                  <span>- {formatCurrency(taxSummary.withholdingTaxAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-xs">
                  <span>Platform Escrow Fee (0% Promotional):</span>
                  <span>₱0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-base text-slate-900 dark:text-white">
                  <span>Net Take-Home via GCash:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(taxSummary.netFreelancerDisbursement)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Estimate:</strong> This is a historical RR 16-2023 illustration. Later rules and tax codes must be checked before filing. The JSON dossier is preparation data, not a signed Form 2307 or proof of BIR remittance. Confirm eligibility and obtain the issued certificate from the withholding agent.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <label className="block">Payee name
                  <input value={payeeName} onChange={(event) => setPayeeName(event.target.value)} autoComplete="name" className="block w-full border rounded p-2 mt-1 bg-transparent" />
                </label>
                <label className="block">Taxpayer Identification Number (TIN)
                  <input value={payeeTin} onChange={(event) => setPayeeTin(event.target.value)} placeholder="123-456-789-000" className="block w-full border rounded p-2 mt-1 bg-transparent" />
                </label>
                <p>Enter the payee name and TIN to prepare the dossier.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <a
                href={canDownload ? `/api/tax/bir2307?${downloadParams}` : undefined}
                aria-disabled={!canDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5" />
                Download BIR Form 2307 (JSON Dossier)
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
    </>
  );
}
