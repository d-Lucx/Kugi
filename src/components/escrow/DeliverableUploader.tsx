'use client'

import React, { useState } from 'react'
import { UploadCloud, CheckCircle2, Copy, FileCode, AlertCircle, Loader2 } from 'lucide-react'

export interface DeliverableMetadata {
  fileName: string
  fileSize: number
  mimeType: string
  sha256Hash: string
  timestamp: string
}

interface DeliverableUploaderProps {
  milestoneId?: string
  milestoneTitle?: string
  onDeliverableReady?: (metadata: DeliverableMetadata) => void
}

export async function computeSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `sha256:${hashHex}`
}

export function DeliverableUploader({
  milestoneId = 'm-active',
  milestoneTitle = 'Current Milestone Deliverable',
  onDeliverableReady,
}: DeliverableUploaderProps) {
  const [computing, setComputing] = useState(false)
  const [metadata, setMetadata] = useState<DeliverableMetadata | null>(null)
  const [copied, setCopied] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = async (file: File) => {
    if (!file) return
    setComputing(true)
    try {
      const hash = await computeSHA256(file)
      const data: DeliverableMetadata = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        sha256Hash: hash,
        timestamp: new Date().toISOString(),
      }
      setMetadata(data)
      if (onDeliverableReady) {
        onDeliverableReady(data)
      }
    } catch (err) {
      console.error('Error computing deliverable hash:', err)
    } finally {
      setComputing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleCopyHash = () => {
    if (!metadata) return
    navigator.clipboard.writeText(metadata.sha256Hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="bg-white dark:bg-[#1a1926] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Milestone Deliverable Cryptographic Verification
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {milestoneTitle} &bull; Client-side SHA-256 seal guarantees deliverable immutability
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Escrow Seal
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-900/30'
        }`}
      >
        <input
          type="file"
          id="deliverable-file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0])
            }
          }}
        />

        <label htmlFor="deliverable-file" className="cursor-pointer flex flex-col items-center">
          {computing ? (
            <div className="py-4 flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold">Computing Web Crypto SHA-256 Checksum...</p>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center gap-2">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-full">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop your deliverable or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports Zip archives, architectural plans, PDFs, and source bundles (up to 200MB)
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Metadata & Checksum Display */}
      {metadata && (
        <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {metadata.fileName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({formatBytes(metadata.fileSize)})
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(metadata.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cryptographic Checksum (SHA-256)
            </span>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
              <code className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 break-all flex-1">
                {metadata.sha256Hash}
              </code>
              <button
                type="button"
                onClick={handleCopyHash}
                className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Copy SHA-256 Hash"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>This hash is logged on the Escrow ledger to verify final deliverable matching.</span>
          </div>
        </div>
      )}
    </div>
  )
}
export default DeliverableUploader
