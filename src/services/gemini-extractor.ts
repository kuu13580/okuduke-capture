import type { ParsedOkuduke } from "./rule-extractor.ts";

export async function extractWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string = "gemini-3.1-flash-lite",
): Promise<ParsedOkuduke> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `この画像は同人誌の奥付（おくづけ）ページです。
記載されている情報から以下の項目を抽出してください。
- title: 同人誌のタイトル（作品名・誌名）
- circle: サークル名（発行サークル）
- author: 著者・執筆者・発行者名
- publishDate: 発行日（例: 2026年8月16日）
- printingCompany: 印刷所名（例: 日光企画、緑陽社、グラフィックなど）
- memo: イベント名（例: コミックマーケット108、コミティアなど）、版数（初版など）、その他特記事項
- rawText: 読み取れたテキストの全文

見つからない項目は空文字 "" にしてください。推測や創作は行わず、記載されている文字だけを抽出してください。`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          circle: { type: "STRING" },
          author: { type: "STRING" },
          publishDate: { type: "STRING" },
          printingCompany: { type: "STRING" },
          memo: { type: "STRING" },
          rawText: { type: "STRING" },
        },
        required: ["title", "circle", "author", "publishDate", "printingCompany", "memo"],
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API エラー (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error("Gemini API から応答を取得できませんでした");
  }

  const parsed = JSON.parse(textContent);
  return {
    title: parsed.title || "",
    circle: parsed.circle || "",
    author: parsed.author || "",
    publishDate: parsed.publishDate || "",
    printingCompany: parsed.printingCompany || "",
    memo: parsed.memo || "",
    rawText: parsed.rawText || "",
  };
}
