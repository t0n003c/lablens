import { pathToFileURL } from "node:url";

export async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const workerUrl = pathToFileURL(`${process.cwd()}/node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs`).href;

  PDFParse.setWorker(workerUrl);

  const parser = new PDFParse({
    data: buffer,
    disableStream: true,
    disableAutoFetch: true,
  });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
