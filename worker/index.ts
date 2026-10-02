import { Hono } from "hono";

type Bindings = {
  GEMINI_API_KEY?: string;
};

export type ExtractRequestBody = {
  base64Data: string;
  mimeType: string;
  model?: string;
};

export type ParsedOkudukeResponse = {
  title: string;
  circle: string;
  author: string;
  publishDate: string;
  printingCompany: string;
  memo: string;
  rawText: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2MB

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/extract", async (c) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return c.json({ error: "画像サイズが上限（2MB）を超えています" }, 413);
  }

  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "サーバー側のGemini APIキーが設定されていません" }, 500);
  }

  let body: ExtractRequestBody;
  try {
    body = await c.req.json<ExtractRequestBody>();
  } catch {
    return c.json({ error: "リクエストJSONのパースに失敗しました" }, 400);
  }

  const { base64Data, mimeType, model = "gemini-3.1-flash-lite" } = body;
  if (!base64Data || !mimeType) {
    return c.json({ error: "画像データ（base64Data, mimeType）が不足しています" }, 400);
  }

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

  const encodedModel = encodeURIComponent(model);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return c.json({ error: `Gemini API呼び出しエラー (${response.status}): ${errorBody}` }, 502);
    }

    const data: any = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      return c.json({ error: "Gemini APIから応答テキストを取得できませんでした" }, 502);
    }

    const parsed = JSON.parse(textContent);
    const result: ParsedOkudukeResponse = {
      title: parsed.title || "",
      circle: parsed.circle || "",
      author: parsed.author || "",
      publishDate: parsed.publishDate || "",
      printingCompany: parsed.printingCompany || "",
      memo: parsed.memo || "",
      rawText: parsed.rawText || "",
    };

    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: `解析処理エラー: ${message}` }, 500);
  }
});

export default app;
