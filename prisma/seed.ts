import { hashPassword } from "../src/lib/security/password";
import { demoResults, demoSummary } from "../src/lib/demo/data";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await hashPassword("ChangeMeNow!2026");
  const user = await prisma.user.upsert({
    where: { email: "demo@lablens.local" },
    update: {},
    create: {
      email: "demo@lablens.local",
      name: "Demo User",
      passwordHash,
      settings: {
        create: {
          theme: "system",
          storeRawPdfs: false,
          localAiPreferred: true,
        },
      },
    },
  });

  const existing = await prisma.healthReport.findFirst({
    where: { userId: user.id, source: "DEMO" },
  });
  const person =
    (await prisma.personProfile.findFirst({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })) ??
    (await prisma.personProfile.create({
      data: {
        userId: user.id,
        name: "Demo User",
        isDefault: true,
      },
    }));

  if (!existing) {
    await prisma.healthReport.create({
      data: {
        userId: user.id,
        personId: person.id,
        source: "DEMO",
        status: "FINALIZED",
        reportDate: new Date("2026-06-15T12:00:00.000Z"),
        labName: "Quest Diagnostics",
        summaryJson: demoSummary,
        recommendationsJson: demoSummary.recommendations,
        labResults: {
          create: demoResults.map((result, index) => ({
            testName: result.testName,
            category: result.category,
            value: result.value,
            stringValue: result.stringValue,
            unit: result.unit,
            referenceLow: result.referenceLow,
            referenceHigh: result.referenceHigh,
            referenceRangeRaw: result.referenceRangeRaw,
            flag: result.flag,
            displayOrder: index,
          })),
        },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "REPORT_CREATED",
      metadata: { seed: true },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
