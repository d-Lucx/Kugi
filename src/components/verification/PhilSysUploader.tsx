'use client'

import React, { useState, useRef } from 'react'
import { ShieldCheck, Camera, CheckCircle2, RefreshCw, AlertCircle, FileImage } from 'lucide-react'

export interface CompressedIdResult {
  blob: Blob
  dataUrl: string
  originalSize: number
  compressedSize: number
  width: number
  height: number
  compressionRatioPercent: number
}

interface PhilSysUploaderProps {
  onCompressed?: (result: CompressedIdResult) => void
}

// Decimal MB keeps accepted output below both common 1MB limits.
export const MAX_ID_BYTES = 1_000_000

export async function compressImage(file: File): Promise<CompressedIdResult> {
  if (!file.type.startsWith('image/') || file.size === 0) {
    throw new Error('Choose a non-empty image of your PhilSys ID.')
  }
  const sourceUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Image could not be decoded. Try a JPEG or PNG photo.'))
      image.src = sourceUrl
    })
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('Image dimensions are invalid.')
    const scale = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    let width = Math.max(1, Math.round(img.naturalWidth * scale))
    let height = Math.max(1, Math.round(img.naturalHeight * scale))

    // Reduce quality first, then dimensions. Never return an oversized payload.
    for (let attempt = 0; attempt < 12; attempt++) {
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Image compression is unavailable in this browser.')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      const quality = attempt === 0 ? 0.85 : attempt === 1 ? 0.7 : 0.55
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('Unable to encode this image.')), 'image/jpeg', quality)
      })
      if (blob.type !== 'image/jpeg' || blob.size === 0) throw new Error('JPEG encoding is unavailable in this browser.')
      if (blob.size < MAX_ID_BYTES) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Unable to prepare the compressed preview.'))
          reader.readAsDataURL(blob)
        })
        return {
          blob, dataUrl, originalSize: file.size, compressedSize: blob.size, width, height,
          compressionRatioPercent: Math.max(0, Math.round((1 - blob.size / file.size) * 100)),
        }
      }
      if (attempt >= 2) {
        width = Math.max(1, Math.floor(width * 0.75))
        height = Math.max(1, Math.floor(height * 0.75))
      }
    }
    throw new Error('Unable to compress this image below 1MB. Choose another photo.')
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export function PhilSysUploader({ onCompressed }: PhilSysUploaderProps) {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<CompressedIdResult | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || busy.current) return
    busy.current = true
    setError(null)
    setResult(null)

    setProcessing(true)
    setFileName(file.name)
    try {
      const compressed = await compressImage(file)
      setResult(compressed)
      if (onCompressed) {
        onCompressed(compressed)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to compress this image. Try again.')
    } finally {
      busy.current = false
      setProcessing(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div className="bg-white dark:bg-[#1a1926] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              PhilSys National ID Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Government-issued PhilID / ePhilID with client-side bandwidth compression
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Tier 1 Mandatory
        </span>
      </div>

      <input
        ref={fileInputRef}
        disabled={processing}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}

      {!result ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 rounded-xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-900/40"
        >
          {processing ? (
            <div className="flex flex-col items-center gap-2 text-emerald-600">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold">Downsampling & Compressing Image...</p>
              <p className="text-xs text-slate-400">Optimizing for provincial low-bandwidth uplinks</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-full">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Take Photo or Upload PhilSys ID Card
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Automatic client-side canvas compression ensures upload size is under 1MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* ID Preview */}
            <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black flex-shrink-0">
              <img
                src={result.dataUrl}
                alt="PhilSys ID Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 bg-black/70 text-[10px] font-mono text-white px-1.5 py-0.5 rounded">
                {result.width}x{result.height}
              </div>
            </div>

            {/* Compression Stats */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {fileName || 'PhilSys ID Photo'}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  -{result.compressionRatioPercent}% Saved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Original Size</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatSize(result.originalSize)}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Compressed Size</span>
                  <span className="font-bold text-emerald-600">{formatSize(result.compressedSize)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <FileImage className="w-3.5 h-3.5 text-slate-400" /> Guaranteed &lt; 1MB Low-Bandwidth Standard
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Replace Photo
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30">
            <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>PhilSys data is securely encrypted in transit and evaluated only for identity verification compliance.</span>
          </div>
        </div>
      )}
    </div>
  )
}
export default PhilSysUploader
