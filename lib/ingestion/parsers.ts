import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ParsedDocument = {
  text: string;
  pages: Array<{ pageNumber: number; text: string }>;
};

export async function parseDocument(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<ParsedDocument> {
  if (mimeType.includes("pdf")) {
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return {
      text: parsed.text ?? "",
      pages:
        parsed.pages?.map((page) => ({
          pageNumber: page.num,
          text: page.text ?? "",
        })) ?? [],
    };
  }

  if (mimeType.includes("word") || mimeType.includes("docx")) {
    const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
    return {
      text: parsed.value ?? "",
      pages: [{ pageNumber: 1, text: parsed.value ?? "" }],
    };
  }

  return {
    text: fileBuffer.toString("utf8"),
    pages: [{ pageNumber: 1, text: fileBuffer.toString("utf8") }],
  };
}
