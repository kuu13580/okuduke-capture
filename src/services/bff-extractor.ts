import type { ParsedOkuduke } from "./rule-extractor.ts";

export async function extractWithBff(
  base64Data: string,
  mimeType: string,
  modelName: string = "gemini-3.1-flash-lite",
): Promise<ParsedOkuduke> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64Data,
      mimeType,
      model: modelName,
    }),
  });

  if (!response.ok) {
    let errorMsg = `APIエラー (${response.status})`;
    const text = await response.text().catch(() => "");
    try {
      const errorJson = JSON.parse(text) as { error?: string };
      if (errorJson?.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      if (text) errorMsg = text.slice(0, 200);
    }
    throw new Error(errorMsg);
  }

  const data = (await response.json()) as Partial<ParsedOkuduke>;
  return {
    title: data.title || "",
    circle: data.circle || "",
    author: data.author || "",
    publishDate: data.publishDate || "",
    printingCompany: data.printingCompany || "",
    memo: data.memo || "",
    rawText: data.rawText || "",
  };
}
