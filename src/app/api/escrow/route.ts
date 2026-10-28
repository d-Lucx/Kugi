import { NextResponse } from "next/server";
import { transitionMilestone, MilestoneState } from "@/lib/escrow-engine";
import { calculateTaxWithholding } from "@/lib/tax-calculator";

// Demo transition endpoint: replay protection lasts only for this server process.
// Production webhooks require authentication and a database transaction that
// persists the response and milestone update under the unique event key.
const processedIdempotencyKeys = new Map<string, {
  response: any;
  timestamp: string;
}>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, currentMilestone, idempotencyKey } = body;
    const reqIdempotencyKey = idempotencyKey || request.headers.get("Idempotency-Key");

    // Idempotency guard: Return prior state immediately on repeated webhook payload
    if (reqIdempotencyKey && processedIdempotencyKeys.has(reqIdempotencyKey)) {
      const cached = processedIdempotencyKeys.get(reqIdempotencyKey)!;
      return NextResponse.json(
        {
          ...cached.response,
          idempotentReplay: true,
          replayedAt: new Date().toISOString(),
        },
        {
          headers: {
            "X-Idempotency-Replay": "true",
            "X-Idempotency-Key": reqIdempotencyKey,
          },
        }
      );
    }

    if (!action || !currentMilestone) {
      return NextResponse.json(
        { error: "Missing required action or milestone data" },
        { status: 400 }
      );
    }

    const updated = transitionMilestone(currentMilestone as MilestoneState, action);
    const tax = calculateTaxWithholding(updated.escrowDeposit);

    const responsePayload = {
      success: true,
      milestone: {
        ...updated,
        idempotencyKey: reqIdempotencyKey || null,
      },
      taxSummary: tax,
      timestamp: new Date().toISOString(),
    };

    if (reqIdempotencyKey) {
      processedIdempotencyKeys.set(reqIdempotencyKey, {
        response: responsePayload,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(responsePayload, {
      headers: reqIdempotencyKey ? { "X-Idempotency-Key": reqIdempotencyKey } : {},
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process escrow transition" },
      { status: 500 }
    );
  }
}
