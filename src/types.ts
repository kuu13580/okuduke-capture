export interface OkudukeRecord {
  id: string;
  title: string;
  circle: string;
  author: string;
  publishDate: string;
  printingCompany: string;
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
