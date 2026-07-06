import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { getEnv } from "@/lib/env";

export async function validatePdfUpload(file: File) {
  const env = getEnv();
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

  if (file.size === 0) {
    return { ok: false as const, error: "The selected file is empty." };
  }

  if (file.size > maxBytes) {
    return { ok: false as const, error: `The file is larger than ${env.MAX_UPLOAD_MB} MB.` };
  }

  if (file.type && file.type !== "application/pdf") {
    return { ok: false as const, error: "Only PDF files are accepted." };
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false as const, error: "The file must use a .pdf extension." };
  }

  return { ok: true as const };
}

export async function maybeStoreUpload(buffer: Buffer, originalName: string, storeRawPdf: boolean) {
  const env = getEnv();
  if (!storeRawPdf) return undefined;

  await mkdir(env.UPLOAD_DIR, { recursive: true });
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}-${safeName}`;
  const path = join(env.UPLOAD_DIR, filename);
  await writeFile(path, buffer, { mode: 0o600 });
  return path;
}

export async function deleteStoredUpload(storedFilePath?: string | null) {
  if (!storedFilePath) return;

  try {
    await unlink(storedFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
