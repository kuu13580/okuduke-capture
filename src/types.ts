export interface OkudukeRecord {
  id: string;
  title: string;
  circle: string;
  author: string;
  publishDate: string;
  printingCompany: string;
  memo: string;
  scannedAt: string;
}

export type GeminiModelId =
  | "gemini-3.1-flash-lite"
  | "gemini-3.5-flash-lite"
  | "gemini-3.5-flash"
  | "gemini-3.8-flash";

export interface GeminiModelInfo {
  id: GeminiModelId;
  name: string;
  tag: string;
  description: string;
}

export const SUPPORTED_MODELS: GeminiModelInfo[] = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    tag: "最速・最安",
    description: "3系最軽量モデル。超低レイテンシ・低コスト重視",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    tag: "最新軽量 (推奨)",
    description: "最新世代の高速・低コストモデル。速度と精度のバランス良好",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    tag: "最新標準",
    description: "最新世代の標準モデル。推論力と認識精度が高い",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tag: "最新主力・最高精度",
    description: "最新主力モデル。装飾文字や難読レイアウトにも強い",
  },
];

export type ExtractionMode = "vlm" | "mock";

export interface AppConfig {
  mode: ExtractionMode;
  geminiApiKey: string;
  geminiModel: GeminiModelId;
}

export function generateTsv(records: OkudukeRecord[]): string {
  const headers = [
    "タイトル",
    "サークル名",
    "著者/発行者",
    "発行日",
    "印刷所",
    "備考",
    "スキャン日時",
  ];
  const rows = records.map((r) => [
    r.title,
    r.circle,
    r.author,
    r.publishDate,
    r.printingCompany,
    r.memo,
    r.scannedAt,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((val) => val.replace(/\t/g, " ")).join("\t"))
    .join("\n");
}

export function generateCsv(records: OkudukeRecord[]): string {
  const headers = [
    "タイトル",
    "サークル名",
    "著者/発行者",
    "発行日",
    "印刷所",
    "備考",
    "スキャン日時",
  ];
  const rows = records.map((r) => [
    r.title,
    r.circle,
    r.author,
    r.publishDate,
    r.printingCompany,
    r.memo,
    r.scannedAt,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((val) => {
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
