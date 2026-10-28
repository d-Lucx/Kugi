"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Paperclip,
  Download,
  AlertOctagon,
  FileCode2,
  FileCheck2,
} from "lucide-react";
import { useKugiStore } from "@/lib/store";
import { formatCurrency } from "@/lib/tax-calculator";
import { InspectionTimer } from "@/components/escrow/InspectionTimer";
import { AntiScamBanner } from "@/components/chat/AntiScamBanner";
import { BirTaxBreakdownModal } from "@/components/tax/BirTaxBreakdownModal";

export default function WorkroomPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) || "KG-90241";

  const {
    orders,
    activeRole,
    sendMessage,
    approveMilestone,
    requestRevision,
    fileDispute,
  } = useKugiStore();

  const order = orders.find((o) => o.orderNumber === orderId) || orders[0];
  const [chatInput, setChatInput] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const activeMilestone =
    order.milestones.find((m) => m.status === "UNDER_INSPECTION") ||
    order.milestones.find((m) => m.status === "ESCROW_LOCKED" || m.status === "IN_PROGRESS") ||
    order.milestones[1] ||
    order.milestones[0];

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(order.orderNumber, chatInput);
    setChatInput("");
  };

  const handleApprove = () => {
    approveMilestone(order.orderNumber, activeMilestone.sequenceOrder);
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;
    requestRevision(order.orderNumber, activeMilestone.sequenceOrder, revisionNotes);
    setRevisionNotes("");
    setShowRevisionDialog(false);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    fileDispute(order.orderNumber, activeMilestone.sequenceOrder, disputeReason);
    setDisputeReason("");
    setShowDisputeDialog(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {activeMilestone?.status === "UNDER_INSPECTION" && (
        <InspectionTimer inspectionEndAt={activeMilestone.inspectionEndAt} sticky />
      )}
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-currency font-bold text-cyan">
                Order #{order.orderNumber}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-semibold">{order.cluster}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-navy mt-0.5">
              {order.contractTitle}
            </h1>
          </div>
        </div>

        {/* Milestone Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {order.milestones.map((m, idx) => (
            <div
              key={m.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${
                m.status === "FUNDS_RELEASED"
                  ? "bg-emerald/15 text-emerald border border-emerald/30"
                  : m.status === "UNDER_INSPECTION"
                  ? "bg-cyan/15 text-cyan-800 border border-cyan/40"
                  : m.status === "DISPUTED"
                  ? "bg-crimson/15 text-crimson border border-crimson/30"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {m.status === "FUNDS_RELEASED" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {m.status === "UNDER_INSPECTION" && <Clock className="w-3.5 h-3.5" />}
              <span>
                P{m.sequenceOrder}: {m.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Right Escrow Held & File Dispute */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Escrow Vault Balance
            </span>
            <span className="font-mono-currency font-bold text-base text-emerald">
              {formatCurrency(activeMilestone?.escrowDeposit || 0)}
            </span>
          </div>

          <button
            onClick={() => setShowDisputeDialog(true)}
            className="px-3 py-1.5 border border-crimson/40 hover:bg-crimson/10 text-crimson text-xs font-bold rounded-xl transition-colors"
          >
            File Dispute
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: Chat (65%) & Inspection Drawer (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT PANEL: ENCRYPTED PROJECT CHAT (65%) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm h-[680px] overflow-hidden">
          {/* Workroom Top Info */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald" />
              <span className="font-bold text-navy">
                Encrypted Provincial Workroom
              </span>
              <span className="text-slate-400">• End-to-end logged for dispute mediation</span>
            </div>
            <span className="text-[11px] font-mono-currency text-slate-500">
              Role: {activeRole}
            </span>
          </div>

          {/* Anti-Scam Shield Banner */}
          <div className="p-4 pb-0">
            <AntiScamBanner />
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {order.chatHistory.map((msg) => {
              if (msg.isSystemAlert) {
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs font-medium ${
                      msg.severity === "CRITICAL"
                        ? "bg-crimson/10 border border-crimson text-crimson"
                        : "bg-slate-100 border border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      {msg.severity === "CRITICAL" ? (
                        <AlertOctagon className="w-3.5 h-3.5 text-crimson" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan" />
                      )}
                      <span>{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-auto">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div>{msg.text}</div>
                  </div>
                );
              }

              const isMe = msg.sender === activeRole;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">{msg.senderName}</span>
                    <span>• {msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-cyan text-white rounded-br-none shadow-sm"
                        : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message... (Anti-Scam regex scans for phone numbers and private GCash)"
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan"
            />

            <button
              type="submit"
              className="p-2.5 bg-cyan hover:bg-cyan-600 text-white rounded-xl transition-all shadow-sm"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: MILESTONE APPROVAL & INSPECTION DRAWER (35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 72-Hour Inspection Clock */}
          {activeMilestone?.status === "UNDER_INSPECTION" && (
            <InspectionTimer inspectionEndAt={activeMilestone.inspectionEndAt} />
          )}

          {/* Active Deliverable Box */}
          <div id="inspection-details" className="scroll-mt-44 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider">
                Inspection Deliverable
              </h2>
              <span className="text-[10px] font-mono-currency px-2 py-0.5 rounded bg-cyan/15 text-cyan-800 font-bold uppercase">
                {activeMilestone?.status.replace("_", " ")}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-navy">
                {activeMilestone?.title}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeMilestone?.description}
              </p>
            </div>

            {/* Submitted File Package */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-cyan" />
                  <div>
                    <div className="text-xs font-bold text-navy">
                      {activeMilestone?.deliverableFileName || "api_inventory_v2_barcode.zip"}
                    </div>
                    <span className="text-[10px] text-slate-400">18.4 MB • ZIP Archive</span>
                  </div>
                </div>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Simulated download of watermarked deliverable archive.");
                  }}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {activeMilestone?.deliverableHash && (
                <div className="text-[10px] font-mono-currency text-slate-500 bg-white p-2 rounded border border-slate-100 truncate">
                  SHA-256: {activeMilestone.deliverableHash}
                </div>
              )}
            </div>

            {/* Tax Computation Notice */}
            <div className="p-3 rounded-xl bg-amber/10 border border-amber/20 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-amber" />
                <span>BIR RR 16-2023 Tax Notice</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Estimated creditable withholding tax is 1% of the 50% tax base ({formatCurrency((activeMilestone?.escrowDeposit || 0) * 0.005)}). Review the breakdown and download a Form 2307 preparation dossier.
              </p>
              <BirTaxBreakdownModal grossAmount={activeMilestone?.escrowDeposit || 0} />
            </div>

            {/* Action Buttons */}
            {activeMilestone?.status === "UNDER_INSPECTION" && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleApprove}
                  className="w-full py-3 bg-emerald hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Disburse {formatCurrency(activeMilestone.escrowDeposit)}</span>
                </button>

                <button
                  onClick={() => setShowRevisionDialog(true)}
                  className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Request Revision with Comments
                </button>

                <button
                  onClick={() => setShowDisputeDialog(true)}
                  className="w-full text-center py-2 text-xs font-semibold text-crimson hover:underline"
                >
                  Escalate to Kugi DavNor Mediation Officer
                </button>
              </div>
            )}

            {activeMilestone?.status === "FUNDS_RELEASED" && (
              <div className="p-3.5 rounded-xl bg-emerald/10 border border-emerald/30 text-emerald text-xs text-center font-bold">
                ✓ Funds Disbursed to Freelancer GCash • 0.5% BIR 2307 Withheld
              </div>
            )}

            {activeMilestone?.status === "DISPUTED" && (
              <div className="p-3.5 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson text-xs text-center font-bold">
                ⚠️ Escrow Frozen • Provincial Mediation Officer Assigned
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      {showRevisionDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="font-bold text-base text-navy">
              Request Milestone Revision
            </h3>
            <p className="text-xs text-slate-600">
              Submitting a revision pauses the 72-hour countdown clock. Specify the required adjustments clearly:
            </p>
            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Detail changes needed to meet contract specifications..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-cyan h-28"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionDialog(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Escalation Modal */}
      {showDisputeDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="font-bold text-base text-crimson">
              Lodge Dispute with Kugi Mediation Desk
            </h3>
            <p className="text-xs text-slate-600">
              Freezes escrow funds immediately. A Kugi Mediation Officer in Mankilam, Tagum City will review logs, deliverables, and contract scope.
            </p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="State the non-compliance or contractual failure..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-crimson h-28"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeDialog(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-crimson hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  Freeze Escrow & Escalate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
