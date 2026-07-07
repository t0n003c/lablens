import type { NextRequest } from "next/server";
import { getClientIp, jsonError } from "@/lib/http";
import { getEnv } from "@/lib/env";
import { parseLabText } from "@/lib/labs/parser";
import { extractPdfText } from "@/lib/labs/pdf";
import { resolvePersonForUser } from "@/lib/people";
import { maybeStoreUpload, validatePdfUpload } from "@/lib/uploads";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { getUserFromRequest } from "@/lib/security/session";
import { summarizeLabResults } from "@/lib/ai/summarizer";
import { recommendationContextFromPerson } from "@/lib/settings/profile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const ipAddress = getClientIp(request);
  const limited = rateLimit(`upload:${user.id}:${ipAddress}`, 20, 60 * 60 * 1000);
  if (!limited.allowed) return jsonError("Too many uploads. Please try again later.", 429);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("A PDF file is required.", 422);

  const validation = await validatePdfUpload(file);
  if (!validation.ok) return jsonError(validation.error, 422);
  const person = await resolvePersonForUser(user, String(form.get("personId") ?? ""), String(form.get("personName") ?? ""));

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);
    const parsed = parseLabText(text);
    const summary = await summarizeLabResults(parsed.results, recommendationContextFromPerson(person));
    const reportDate = parsed.reportDate ? new Date(parsed.reportDate) : new Date();
    const parserWarnings = [...parsed.warnings];
    const storeRawPdf = user.settings?.storeRawPdfs ?? getEnv().STORE_RAW_PDFS;
    let storedFilePath: string | undefined;

    try {
      storedFilePath = await maybeStoreUpload(buffer, file.name, storeRawPdf);
    } catch (storageError) {
      console.error("Raw PDF storage failed", storageError);
      parserWarnings.push("Raw PDF storage is on, but the original PDF could not be saved. Extracted values were still saved.");
    }

    const report = await prisma.healthReport.create({
      data: {
        userId: user.id,
        personId: person.id,
        source: "PDF",
        status: "DRAFT",
        reportDate,
        labName: parsed.labName,
        originalFileName: file.name,
        storedFilePath,
        extractedTextHash: parsed.extractedTextHash,
        parserWarnings,
        summaryJson: summary,
        recommendationsJson: summary.recommendations,
        labResults: {
          create: parsed.results.map((result, index) => ({
            testName: result.testName,
            category: result.category,
            value: result.value,
            stringValue: result.stringValue,
            unit: result.unit,
            referenceLow: result.referenceLow,
            referenceHigh: result.referenceHigh,
            referenceRangeRaw: result.referenceRangeRaw,
            flag: result.flag,
            notes: result.notes,
            displayOrder: index,
          })),
        },
      },
      include: { person: true, labResults: true },
    });

    await auditLog({
      userId: user.id,
      action: "UPLOAD_CREATED",
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
      metadata: { reportId: report.id, personId: person.id, resultCount: report.labResults.length },
    });

    return Response.json({ report, summary }, { status: 201 });
  } catch (error) {
    console.error("PDF upload failed", error);
    return jsonError(
      "We could not read text from this PDF. Try another PDF, or use Manual entry for the lab values.",
      422,
      { code: "PDF_PARSE_FAILED" },
    );
  }
}
