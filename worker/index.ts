import { Hono } from "hono";

export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type Bindings = {
  GEMINI_API_KEY?: string;
  RATE_LIMITER?: RateLimitBinding;
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
const ALLOWED_MODELS = new Set(["gemini-3.1-flash-lite", "gemini-2.5-flash"]);

const readBodyWithinLimit = async (
  request: Request,
  maxBytes: number,
): Promise<Uint8Array | null> => {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
};

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/extract", async (c) => {
  const limiter = c.env.RATE_LIMITER;
  if (limiter) {
    const clientIp =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    try {
      const { success } = await limiter.limit({ key: clientIp });
      if (!success) {
        c.header("Retry-After", "60");
        return c.json(
          {
            error: "短時間のアクセス数が上限を超過しました。少し待ってから再試行してください。",
          },
          429,
        );
      }
    } catch (err) {
      console.warn("Rate limit check failed (fail-open):", err);
    }
  }

  const contentLength = c.req.header("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return c.json({ error: "画像サイズが上限（2MB）を超えています" }, 413);
  }

  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "サーバー側のGemini APIキーが設定されていません" }, 500);
  }

  let rawBody: Uint8Array | null;
  try {
    rawBody = await readBodyWithinLimit(c.req.raw, MAX_PAYLOAD_BYTES);
  } catch {
    return c.json({ error: "リクエストJSONのパースに失敗しました" }, 400);
  }
  if (rawBody === null) {
    return c.json({ error: "画像サイズが上限（2MB）を超えています" }, 413);
  }

  let body: ExtractRequestBody;
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody)) as ExtractRequestBody;
  } catch {
    return c.json({ error: "リクエストJSONのパースに失敗しました" }, 400);
  }

  const { base64Data, mimeType, model = "gemini-3.1-flash-lite" } = body;
  if (!ALLOWED_MODELS.has(model)) {
    return c.json({ error: "許可されていないモデルです" }, 400);
  }

  if (!base64Data || !mimeType) {
    return c.json({ error: "画像データ（base64Data, mimeType）が不足しています" }, 400);
  }

  const prompt = `この画像は同人誌の奥付（おくづけ）ページです。
記載されている情報から以下の項目を抽出してください。
- title: 同人誌のタイトル（作品名・誌名）
- circle: サークル名（発行サークル）
- author: 著者・執筆者・発行者名
- publishDate: 発行日（原則 YYYY-MM-DD 形式。例: 2026-08-16。年や月のみの場合は01日で補完）
- printingCompany: 印刷所名（例: 日光企画、緑陽社、グラフィックなど）
- memo: 上記の項目に分類できなかったテキスト（読み取りミスの修正用コピペ素材、イベント名、連絡先・URL・SNSアカウント、版数など）。後からユーザーがコピペして各項目に補完できるように残してください。
- rawText: 読み取れたテキストの全文

【重要：memo から除外する定型文】
以下のような同人誌によくある定型注意書き・免責文は、memo には含めず除外してください：
1. 無断転載・複製・アップロード・フリマ/オークション出品・自作発言等の禁止文（例:「無断転載禁止」「複写・複製を禁じます」「禁無断転載」「転売禁止」等）
2. 成人向け・年齢制限の定型文（例:「18禁」「R-18」「成人向け」「18歳未満の購入・閲覧を禁止します」等）
3. 二次創作の定型免責文（例:「公式・版権元とは一切関係ありません」等）
4. 単なる項目ラベル単体（例:「発行日」「印刷」「著者」等の単語のみ）

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
      console.error("Gemini API error:", response.status, errorBody);
      return c.json({ error: `Gemini API呼び出しエラー (${response.status})` }, 502);
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
    console.error("Extract failed:", err);
    return c.json({ error: "解析処理エラーが発生しました" }, 500);
  }
});

export default app;
