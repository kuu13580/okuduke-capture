export const DEFAULT_BOOK_SIZES = ["B5", "A5", "A4", "B6", "文庫", "新書"] as const;

export interface OkudukeRecord {
  id: string;
  title: string;
  circle: string;
  author: string;
  publishDate: string;
  printingCompany: string;
  pageCount?: string;
  size?: string;
  memo: string;
  scannedAt: string;
  isCompleted?: boolean;
  checkedFields?: string[];
}

export function generateTsv(records: OkudukeRecord[]): string {
  const headers = [
    "タイトル",
    "サークル名",
    "著者/発行者",
    "発行日",
    "印刷所",
    "ページ数",
    "サイズ",
    "備考",
    "スキャン日時",
  ];
  const rows = records.map((r) => [
    r.title,
    r.circle,
    r.author,
    r.publishDate,
    r.printingCompany,
    r.pageCount ?? "",
    r.size ?? "",
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
    "ページ数",
    "サイズ",
    "備考",
    "スキャン日時",
  ];
  const rows = records.map((r) => [
    r.title,
    r.circle,
    r.author,
    r.publishDate,
    r.printingCompany,
    r.pageCount ?? "",
    r.size ?? "",
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

export interface FieldCandidates {
  circles: string[];
  authors: string[];
  printingCompanies: string[];
  sizes: string[];
}

export function extractFieldCandidates(records: OkudukeRecord[]): FieldCandidates {
  const cleanAndUnique = (values: (string | undefined)[]) =>
    Array.from(new Set(values.map((v) => v?.trim() || "").filter(Boolean)));

  const customSizes = cleanAndUnique(records.map((r) => r.size));
  const sizes = Array.from(new Set([...DEFAULT_BOOK_SIZES, ...customSizes]));

  return {
    circles: cleanAndUnique(records.map((r) => r.circle)),
    authors: cleanAndUnique(records.map((r) => r.author)),
    printingCompanies: cleanAndUnique(records.map((r) => r.printingCompany)),
    sizes,
  };
}

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.kuu13580.okuduke.twa";
