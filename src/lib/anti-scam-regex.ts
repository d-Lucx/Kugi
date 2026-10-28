/**
 * Anti-Disintermediation & Anti-Scam Regex Shield for Kugi.ph
 * Protects buyers and freelancers by detecting off-platform transaction attempts
 * and triggering Signal Crimson alerts.
 */

export interface ScamScanResult {
  isSuspicious: boolean;
  triggers: string[];
  severity: "LOW" | "MEDIUM" | "CRITICAL";
  warningMessage?: string;
}

const PH_MOBILE_REGEX = /(?:\+?63|0)[\s.-]?9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/i;
const GCASH_WALLET_REGEX = /\b(?:gcash|maya|paymaya|g-cash)[\s:=-]+(?:#|no\.?|account|acct)?[\s:=-]*(?:\+?63|0)?[\s.-]?9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/i;
const TELEGRAM_REGEX = /(?:t\.me\/|telegram[\s:]+@?|@[\w_]{5,32}\b)/i;
const VIBER_WHATSAPP_REGEX = /\b(?:viber|whatsapp)[\s:=-]+(?:\+?63|0)?[\s.-]?9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/i;
const OFF_PLATFORM_KEYWORD_REGEX = /\b(?:direct transfer|off-platform|bypass escrow|direct gcash|send directly to my account|personal bpi|personal bdo|personal landbank|bdo transfer|bpi transfer)\b/i;

export function scanMessageForDisintermediation(content: string): ScamScanResult {
  const triggers: string[] = [];

  if (GCASH_WALLET_REGEX.test(content)) {
    triggers.push("Direct GCash/Maya wallet payment solicitation detected");
  }

  if (PH_MOBILE_REGEX.test(content)) {
    triggers.push("Private Philippine mobile phone number shared");
  }

  if (TELEGRAM_REGEX.test(content)) {
    triggers.push("External Telegram handle or messaging link detected");
  }

  if (VIBER_WHATSAPP_REGEX.test(content)) {
    triggers.push("External WhatsApp/Viber off-platform contact detected");
  }

  if (OFF_PLATFORM_KEYWORD_REGEX.test(content)) {
    triggers.push("Disintermediation phrase attempting to bypass Kugi Escrow detected");
  }

  const isSuspicious = triggers.length > 0;
  const severity = triggers.some((t) => t.includes("Escrow") || t.includes("GCash"))
    ? "CRITICAL"
    : triggers.length > 1
    ? "MEDIUM"
    : "LOW";

  return {
    isSuspicious,
    triggers,
    severity: isSuspicious ? severity : "LOW",
    warningMessage: isSuspicious
      ? "Safety tip: This message may include external contact or payment details. Keep payments and project records in Kugi so they are available for dispute review. Check unexpected requests before sending money, and use File Dispute if you need help."
      : undefined,
  };
}
