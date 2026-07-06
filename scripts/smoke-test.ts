import { existsSync } from "node:fs";
import { generate } from "otplib";
import { prisma } from "../src/lib/prisma";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const password = "ChangeMeNow!2026";
const resetPassword = "ResetMeNow!2026";
const tempEmail = `smoke-${Date.now()}@lablens.local`;

type JsonValue = Record<string, unknown>;

class CookieJar {
  private cookies = new Map<string, string>();

  apply(response: Response) {
    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) return;

    for (const chunk of setCookie.split(/,(?=\s*[^;,\s]+=)/)) {
      const [pair] = chunk.trim().split(";");
      const index = pair.indexOf("=");
      if (index > 0) {
        this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
      }
    }
  }

  header() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }
}

const authed = new CookieJar();

function log(ok: string) {
  console.log(`✓ ${ok}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function request(path: string, init: RequestInit & { jar?: CookieJar } = {}) {
  const headers = new Headers(init.headers);
  const jar = init.jar;
  if (jar?.header()) headers.set("Cookie", jar.header());

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  jar?.apply(response);
  return response;
}

async function json(response: Response) {
  const text = await response.text();
  return text ? (JSON.parse(text) as JsonValue) : {};
}

async function expectStatus(path: string, expected: number, init: RequestInit & { jar?: CookieJar } = {}) {
  const response = await request(path, init);
  assert(response.status === expected, `${path} returned ${response.status}, expected ${expected}`);
  return response;
}

async function expectOkPage(path: string, expectedText: string) {
  const response = await expectStatus(path, 200);
  const text = await response.text();
  assert(text.includes(expectedText), `${path} did not include expected text: ${expectedText}`);
  log(`page ${path}`);
}

function buildTinyPdf() {
  const content = Buffer.from(
    "BT /F1 12 Tf 72 720 Td (Quest Diagnostics) Tj 0 -18 Td (Collected: 06/15/2026) Tj 0 -18 Td (GLUCOSE 102 Reference Range: 65-99 mg/dL) Tj 0 -18 Td (HDL Cholesterol 58 mg/dL >39) Tj ET",
  );
  const objects = [
    Buffer.from("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"),
    Buffer.from("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"),
    Buffer.from(
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    ),
    Buffer.from("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"),
    Buffer.concat([Buffer.from(`5 0 obj << /Length ${content.length} >> stream\n`), content, Buffer.from("\nendstream endobj\n")]),
  ];

  const chunks = [Buffer.from("%PDF-1.4\n")];
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(object);
  }

  const beforeXref = Buffer.concat(chunks);
  const xrefStart = beforeXref.length;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`),
    `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  ].join("");

  return new File([beforeXref, Buffer.from(xref)], "smoke-lab-report.pdf", { type: "application/pdf" });
}

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: tempEmail } });
}

async function main() {
  await cleanup();

  try {
    const health = await json(await expectStatus("/api/health", 200));
    assert(health.status === "ok", `health status was ${String(health.status)}`);
    assert(Array.isArray(health.warnings) && health.warnings.length === 0, "health warnings were not empty");
    log("health endpoint");

    const manifest = await json(await expectStatus("/manifest.webmanifest", 200));
    assert(manifest.name === "LabLens" && manifest.display === "standalone", "PWA manifest is not install-ready");
    assert(Array.isArray(manifest.icons) && manifest.icons.length >= 3, "PWA manifest icons missing");
    await expectStatus("/sw.js", 200);
    await expectStatus("/offline.html", 200);
    await expectStatus("/icons/lablens-icon-192.png", 200);
    await expectStatus("/icons/lablens-icon-512.png", 200);
    log("PWA install assets");

    await Promise.all([
      expectOkPage("/", "Lab report review"),
      expectOkPage("/login", "Welcome back"),
      expectOkPage("/register", "Create your account"),
      expectOkPage("/recover", "Account recovery"),
      expectOkPage("/upload", "Upload a MyQuest report"),
      expectOkPage("/manual", "Add a lab value"),
      expectOkPage("/reports", "Reports"),
      expectOkPage("/people", "People"),
      expectOkPage("/settings", "Settings"),
    ]);

    await expectStatus("/api/auth/me", 401);
    await expectStatus("/api/settings", 401);
    await expectStatus("/api/people", 401);
    await expectStatus("/api/reports", 401);
    await expectStatus("/api/account/export", 401);
    await expectStatus("/api/account/data", 401, { method: "DELETE" });
    await expectStatus("/api/auth/biometric/register/options", 401, { method: "POST" });
    await expectStatus("/api/auth/biometric", 401, { method: "DELETE" });
    await expectStatus("/api/auth/biometric/login/verify", 401, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: { id: "missing" } }),
    });
    await expectStatus("/api/reports/manual", 401, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    log("unauthenticated protections");

    const register = await json(
      await expectStatus("/api/auth/register", 201, {
        method: "POST",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Smoke Test", email: tempEmail, password }),
      }),
    );
    assert((register.user as JsonValue)?.email === tempEmail, "registered user email mismatch");
    log("account registration");

    const me = await json(await expectStatus("/api/auth/me", 200, { jar: authed }));
    assert((me.user as JsonValue)?.email === tempEmail, "current user mismatch");
    log("session lookup");

    const settings = await json(await expectStatus("/api/settings", 200, { jar: authed }));
    assert(settings.settings, "settings missing");
    await expectStatus("/api/settings", 200, {
      method: "PATCH",
      jar: authed,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: "dark",
        localAiPreferred: true,
        storeRawPdfs: true,
        profileAge: 42,
        profileGender: "woman",
        profileCountry: "United States",
        profileEthnicity: "Vietnamese",
        profileJob: "remote desk job",
        profileHobbies: "walking and cooking",
        profileRoutine: "busy mornings",
      }),
    });
    log("settings read/update");

    const biometricSetup = await json(await expectStatus("/api/auth/biometric/register/options", 200, { method: "POST", jar: authed }));
    assert(typeof (biometricSetup.options as JsonValue)?.challenge === "string", "biometric registration challenge missing");
    assert(((biometricSetup.options as JsonValue)?.rp as JsonValue)?.name === "LabLens", "biometric registration RP name mismatch");
    await expectStatus("/api/auth/biometric", 200, { method: "DELETE", jar: authed });
    log("biometric setup options");

    const peopleInitial = await json(await expectStatus("/api/people", 200, { jar: authed }));
    assert(Array.isArray(peopleInitial.people) && peopleInitial.people.length >= 1, "default person was not created");
    const defaultPersonId = peopleInitial.defaultPersonId as string;
    assert(typeof defaultPersonId === "string" && defaultPersonId.length > 0, "default person id missing");
    const familyPerson = await json(
      await expectStatus("/api/people", 201, {
        method: "POST",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alex Smoke",
          profileAge: 38,
          profileGender: "man",
          profileJob: "teacher",
          profileHobbies: "soccer",
        }),
      }),
    );
    const familyPersonId = (familyPerson.person as JsonValue)?.id as string;
    assert(typeof familyPersonId === "string" && familyPersonId !== defaultPersonId, "second person was not created");
    await expectStatus(`/api/people/${familyPersonId}`, 200, {
      method: "PATCH",
      jar: authed,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileRoutine: "school days and family dinners" }),
    });
    log("people create/update");

    const twoFactorSetup = await json(await expectStatus("/api/auth/2fa/setup", 200, { method: "POST", jar: authed }));
    assert(typeof twoFactorSetup.otpauth === "string" && twoFactorSetup.otpauth.startsWith("otpauth://"), "2FA URI missing");
    assert(typeof twoFactorSetup.qrCode === "string" && twoFactorSetup.qrCode.startsWith("data:image/png"), "2FA QR missing");
    const secret = new URL(twoFactorSetup.otpauth as string).searchParams.get("secret");
    assert(secret, "2FA secret missing from URI");
    const token = await generate({ secret });
    await expectStatus("/api/auth/2fa/verify", 200, {
      method: "POST",
      jar: authed,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: token }),
    });
    log("2FA setup/verify");

    const smokeUser = await prisma.user.findUnique({ where: { email: tempEmail } });
    assert(smokeUser, "smoke user missing for biometric login enforcement");
    await prisma.passkey.create({
      data: {
        userId: smokeUser.id,
        credentialId: "fake-smoke-passkey",
        publicKey: Buffer.from("not-a-real-public-key"),
        transports: ["internal"],
      },
    });
    await prisma.user.update({ where: { id: smokeUser.id }, data: { passkeyEnabled: true } });
    const biometricLoginJar = new CookieJar();
    const biometricLoginToken = await generate({ secret });
    const biometricLogin = await json(
      await expectStatus("/api/auth/login", 200, {
        method: "POST",
        jar: biometricLoginJar,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail, password, twoFactorCode: biometricLoginToken }),
      }),
    );
    assert(biometricLogin.biometricRequired === true, "biometric login was not required");
    assert(typeof (biometricLogin.options as JsonValue)?.challenge === "string", "biometric login challenge missing");
    await expectStatus("/api/auth/me", 401, { jar: biometricLoginJar });
    await prisma.passkey.deleteMany({ where: { userId: smokeUser.id } });
    await prisma.user.update({ where: { id: smokeUser.id }, data: { passkeyEnabled: false } });
    log("biometric login enforcement");

    const manual = await json(
      await expectStatus("/api/reports/manual", 201, {
        method: "POST",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: "2026-06-15",
          labName: "Quest Diagnostics",
          notes: "Smoke manual report",
          personId: familyPersonId,
          results: [
            {
              testName: "LDL Cholesterol",
              value: 121,
              unit: "mg/dL",
              referenceHigh: 99,
              referenceRangeRaw: "<100",
            },
          ],
        }),
      }),
    );
    assert(Array.isArray((manual.report as JsonValue)?.labResults), "manual report results missing");
    assert(((manual.report as JsonValue)?.person as JsonValue)?.id === familyPersonId, "manual report person mismatch");
    log("manual report create");

    const form = new FormData();
    form.set("personId", defaultPersonId);
    form.set("file", buildTinyPdf());
    const upload = await json(await expectStatus("/api/reports/upload", 201, { method: "POST", jar: authed, body: form }));
    assert((upload.report as JsonValue)?.source === "PDF", "PDF upload report missing");
    assert(((upload.report as JsonValue)?.person as JsonValue)?.id === defaultPersonId, "PDF report person mismatch");
    assert(Array.isArray((upload.report as JsonValue)?.labResults) && ((upload.report as JsonValue).labResults as unknown[]).length >= 1, "PDF upload did not extract lab rows");
    const storedFilePath = (upload.report as JsonValue)?.storedFilePath as string | undefined;
    assert(typeof storedFilePath === "string" && existsSync(storedFilePath), "raw PDF was not stored when storage was enabled");
    log("PDF upload draft");

    const uploadedReport = upload.report as JsonValue;
    const uploadedRows = (uploadedReport.labResults as JsonValue[]).map((row) => ({
      id: row.id,
      keep: true,
      testName: row.testName,
      value: row.value,
      stringValue: row.stringValue,
      unit: row.unit,
      referenceLow: row.referenceLow,
      referenceHigh: row.referenceHigh,
      referenceRangeRaw: row.referenceRangeRaw,
      notes: row.notes,
    }));
    const reviewed = await json(
      await expectStatus(`/api/reports/${uploadedReport.id as string}`, 200, {
        method: "PATCH",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: "2026-06-15",
          labName: "Quest Diagnostics",
          personId: defaultPersonId,
          status: "FINALIZED",
          results: uploadedRows,
        }),
      }),
    );
    assert((reviewed.report as JsonValue)?.status === "FINALIZED", "uploaded report was not finalized");
    log("PDF review/finalize");

    const plan = await json(
      await expectStatus("/api/action-plan", 201, {
        method: "POST",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Movement",
          text: "Try a 10-minute easy walk after the carb-heavy meal.",
          reportId: uploadedReport.id,
        }),
      }),
    );
    assert((plan.item as JsonValue)?.status === "ACTIVE", "action plan item was not created");
    const planList = await json(await expectStatus("/api/action-plan", 200, { jar: authed }));
    assert(Array.isArray(planList.items) && planList.items.length >= 1, "action plan list was empty");
    const updatedPlan = await json(
      await expectStatus(`/api/action-plan/${(plan.item as JsonValue).id as string}`, 200, {
        method: "PATCH",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      }),
    );
    assert((updatedPlan.item as JsonValue)?.status === "DONE", "action plan item was not marked done");
    const replacedPlan = await json(
      await expectStatus(`/api/action-plan/${(plan.item as JsonValue).id as string}`, 200, {
        method: "PATCH",
        jar: authed,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Stand or stretch 5 minutes after that meal.",
          notes: "For A1c, try a 10-20 minute easy walk after the meal that usually has the most carbs, if that is safe for you.",
        }),
      }),
    );
    assert((replacedPlan.item as JsonValue)?.text === "Stand or stretch 5 minutes after that meal.", "action plan replacement text was not saved");
    const familyPlanList = await json(await expectStatus(`/api/action-plan?personId=${familyPersonId}`, 200, { jar: authed }));
    assert(Array.isArray(familyPlanList.items) && familyPlanList.items.length === 0, "family person action plan should not include default person's report steps");
    await expectStatus("/api/action-plan", 201, {
      method: "POST",
      jar: authed,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Routine", text: "Use a weekday rule for sweet drinks.", reportId: uploadedReport.id }),
    });
    log("action plan create/update");

    const reports = await json(await expectStatus("/api/reports", 200, { jar: authed }));
    assert(Array.isArray(reports.reports) && reports.reports.length >= 2, "report list did not include created reports");
    const familyReports = await json(await expectStatus(`/api/reports?personId=${familyPersonId}`, 200, { jar: authed }));
    assert(
      Array.isArray(familyReports.reports) &&
        familyReports.reports.length === 1 &&
        ((familyReports.reports[0] as JsonValue).person as JsonValue)?.id === familyPersonId,
      "person report filter did not isolate the second person's report",
    );
    const defaultReports = await json(await expectStatus(`/api/reports?personId=${defaultPersonId}`, 200, { jar: authed }));
    assert(
      Array.isArray(defaultReports.reports) &&
        defaultReports.reports.length >= 1 &&
        defaultReports.reports.every((report) => ((report as JsonValue).person as JsonValue)?.id === defaultPersonId),
      "person report filter did not isolate the default person's reports",
    );
    const search = await json(await expectStatus("/api/reports?q=LDL", 200, { jar: authed }));
    assert(Array.isArray(search.reports) && search.reports.length >= 1, "report search did not find LDL");
    log("report list/search");

    const exported = await json(await expectStatus("/api/account/export", 200, { jar: authed }));
    assert(Array.isArray(exported.reports) && exported.reports.length >= 2, "export did not include reports");
    assert(Array.isArray(exported.people) && exported.people.length >= 2, "export did not include people");
    log("data export");

    const deletedReport = await json(
      await expectStatus(`/api/reports/${(manual.report as JsonValue).id as string}`, 200, { method: "DELETE", jar: authed }),
    );
    assert(deletedReport.ok === true, "single report delete failed");
    const afterSingleDelete = await json(await expectStatus("/api/reports", 200, { jar: authed }));
    assert(
      Array.isArray(afterSingleDelete.reports) &&
        !afterSingleDelete.reports.some((report) => (report as JsonValue).id === (manual.report as JsonValue).id),
      "deleted report remained in report list",
    );
    log("single report delete");

    const deleted = await json(await expectStatus("/api/account/data", 200, { method: "DELETE", jar: authed }));
    assert((deleted.deletedReports as number) >= 1, "delete data did not remove expected reports");
    assert((deleted.deletedPeople as number) >= 2, "delete data did not remove all people profiles");
    const afterDelete = await json(await expectStatus("/api/reports", 200, { jar: authed }));
    assert(Array.isArray(afterDelete.reports) && afterDelete.reports.length === 0, "reports remained after delete");
    const peopleAfterDelete = await json(await expectStatus("/api/people", 200, { jar: authed }));
    assert(Array.isArray(peopleAfterDelete.people) && peopleAfterDelete.people.length === 1, "account data delete did not recreate one clean default person");
    const planAfterDelete = await json(await expectStatus("/api/action-plan", 200, { jar: authed }));
    assert(Array.isArray(planAfterDelete.items) && planAfterDelete.items.length === 0, "action items remained after delete");
    assert(!existsSync(storedFilePath), "stored raw PDF remained after account data delete");
    log("account data delete");

    await expectStatus("/api/auth/logout", 200, { method: "POST", jar: authed });
    await expectStatus("/api/auth/me", 401, { jar: authed });
    log("logout");

    const fresh = new CookieJar();
    await expectStatus("/api/auth/login", 401, {
      method: "POST",
      jar: fresh,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: tempEmail, password }),
    });
    const freshToken = await generate({ secret });
    await expectStatus("/api/auth/login", 200, {
      method: "POST",
      jar: fresh,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: tempEmail, password, twoFactorCode: freshToken }),
    });
    log("2FA login enforcement");

    const recovery = await json(
      await expectStatus("/api/auth/recover", 200, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail }),
      }),
    );
    assert(typeof recovery.recoveryToken === "string" && recovery.recoveryToken.length > 20, "recovery token missing");
    await expectStatus("/api/auth/reset", 200, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: recovery.recoveryToken, password: resetPassword }),
    });
    await expectStatus("/api/auth/me", 401, { jar: fresh });
    const resetJar = new CookieJar();
    const resetLoginToken = await generate({ secret });
    await expectStatus("/api/auth/login", 200, {
      method: "POST",
      jar: resetJar,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: tempEmail, password: resetPassword, twoFactorCode: resetLoginToken }),
    });
    log("account recovery/reset");

    console.log(`Smoke audit passed for ${baseUrl}`);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
