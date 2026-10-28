import { NextResponse } from "next/server";
import { generateBir2307Voucher, calculateTaxWithholding } from "@/lib/tax-calculator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payee = (searchParams.get("payee") ?? searchParams.get("payeeName") ?? "").trim();
    const tin = (searchParams.get("tin") ?? "").trim();
    const address = searchParams.get("address") || "";
    const amountParam = searchParams.get("amount") ?? searchParams.get("grossAmount");
    const grossAmount = amountParam?.trim() ? Number(amountParam) : NaN;
    if (!payee || !/^\d{3}-\d{3}-\d{3}-\d{3,5}$/.test(tin) ||
        !Number.isFinite(grossAmount) || grossAmount <= 0 || grossAmount > 9999999999.99) {
      return NextResponse.json({ error: "A payee, valid TIN, and positive gross amount are required" }, { status: 400 });
    }

    const taxResult = calculateTaxWithholding(grossAmount);
    const voucher = generateBir2307Voucher(
      payee,
      tin,
      address,
      grossAmount,
      taxResult.withholdingTaxAmount
    );

    return NextResponse.json({
      success: true,
      status: "DRAFT",
      notice: "Historical RR 16-2023 preparation dossier only. Not a signed Form 2307, current filing computation, or proof of tax remittance.",
      voucher,
      legalFramework: "BIR Revenue Regulations No. 16-2023 / RMC No. 8-2024",
      rdoBranch: "RDO 112 - Tagum City, Davao del Norte",
    }, { headers: {
      "Content-Disposition": 'attachment; filename="bir2307-dossier.json"',
      "Cache-Control": "no-store",
    } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate BIR Form 2307 voucher" },
      { status: 500 }
    );
  }
}
