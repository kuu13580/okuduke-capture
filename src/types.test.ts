import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOOK_SIZES,
  extractFieldCandidates,
  generateCsv,
  generateTsv,
  type OkudukeRecord,
} from "./types.ts";

describe("export helpers", () => {
  const sampleRecords: OkudukeRecord[] = [
    {
      id: "1",
      title: "テスト同人誌 1",
      circle: "サークルA",
      author: "作者A",
      publishDate: "2026/08/15",
      printingCompany: "日光企画",
      pageCount: "24",
      size: "B5",
      memo: "初版",
      scannedAt: "2026-10-01 12:00",
    },
    {
      id: "2",
      title: 'テスト同人誌 "2"',
      circle: "サークルB",
      author: "作者B",
      publishDate: "2026/08/16",
      printingCompany: "緑陽社",
      memo: "",
      scannedAt: "2026-10-01 12:05",
    },
  ];

  it("generates valid TSV format for spreadsheet pasting including legacy records without pageCount/size", () => {
    const tsv = generateTsv(sampleRecords);
    const lines = tsv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      "タイトル\tサークル名\t著者/発行者\t発行日\t印刷所\tページ数\tサイズ\t備考\tスキャン日時",
    );
    expect(lines[1]).toBe(
      "テスト同人誌 1\tサークルA\t作者A\t2026/08/15\t日光企画\t24\tB5\t初版\t2026-10-01 12:00",
    );
    expect(lines[2]).toBe(
      'テスト同人誌 "2"\tサークルB\t作者B\t2026/08/16\t緑陽社\t\t\t\t2026-10-01 12:05',
    );
  });

  it("generates valid CSV format with quotes escaping", () => {
    const csv = generateCsv(sampleRecords);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      '"タイトル","サークル名","著者/発行者","発行日","印刷所","ページ数","サイズ","備考","スキャン日時"',
    );
    expect(lines[1]).toBe(
      '"テスト同人誌 1","サークルA","作者A","2026/08/15","日光企画","24","B5","初版","2026-10-01 12:00"',
    );
    expect(lines[2]).toContain('"テスト同人誌 ""2"""');
  });

  it("extracts unique field candidates and merges custom sizes with default book sizes", () => {
    const records: OkudukeRecord[] = [
      ...sampleRecords,
      {
        id: "3",
        title: "テスト同人誌 3",
        circle: "サークルA", // 重複
        author: "  ", // 空文字
        publishDate: "2026/08/17",
        printingCompany: "日光企画", // 重複
        size: "正方形(180×180mm)", // カスタムサイズ
        memo: "",
        scannedAt: "2026-10-01 12:10",
      },
    ];

    const candidates = extractFieldCandidates(records);
    expect(candidates.circles).toEqual(["サークルA", "サークルB"]);
    expect(candidates.authors).toEqual(["作者A", "作者B"]);
    expect(candidates.printingCompanies).toEqual(["日光企画", "緑陽社"]);
    expect(candidates.sizes).toEqual([...DEFAULT_BOOK_SIZES, "正方形(180×180mm)"]);
  });
});
