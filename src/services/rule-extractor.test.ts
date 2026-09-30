import { describe, expect, it } from "vitest";
import { cleanOcrText, parseOkudukeFromText } from "./rule-extractor.ts";

describe("rule-extractor", () => {
  it("parses typical doujinshi okuduke text correctly", () => {
    const sampleOkuduke = `
      夏の思い出
      発行日: 2026年8月16日
      サークル: 星空工房
      著者: 山田太郎
      印刷所: 日光企画
      コミックマーケット108 初版
      無断転載を禁じます
    `;

    const parsed = parseOkudukeFromText(sampleOkuduke);

    expect(parsed.title).toBe("夏の思い出");
    expect(parsed.publishDate).toBe("2026年8月16日");
    expect(parsed.circle).toBe("星空工房");
    expect(parsed.author).toBe("山田太郎");
    expect(parsed.printingCompany).toBe("日光企画");
    expect(parsed.memo).toContain("コミックマーケット108 初版");
  });

  it("handles dot-separated dates and English labels", () => {
    const sampleOkuduke = `
      Title: Galactic Express
      Circle: Space Craft
      Author: Kenji M.
      Date: 2026.12.30
      Printed by: Graphic
    `;

    const parsed = parseOkudukeFromText(sampleOkuduke);

    expect(parsed.title).toBe("Galactic Express");
    expect(parsed.publishDate).toBe("2026.12.30");
    expect(parsed.circle).toBe("Space Craft");
    expect(parsed.author).toBe("Kenji M.");
    expect(parsed.printingCompany).toBe("Graphic");
  });

  it("correctly cleans and parses real noisy OCR text from user", () => {
    const userRawOcr = `
了 ! 付 2026 年 09 月 20 晶 初版 発行
ニニ ーー 一 一 ーー )
ひみ つの 部 活動

サー クル ぽ む ラフ ライス
発行 者 ラー ヴァ ル
連絡 先
yunoctiune@gmalil.com
印刷 _booknext 様
一下 二 放 ビ ニニ ニニ ーーー
テキ スト 本 書 の コピ ー、 ス キヤ ンプ 、 デジ タル 化 等 の 無断 複 租 ・ 転載 は
著作 権 法 上 で の 例外 を 除き 禁じ られ て いま うす 。 本 書 を 代行 業者 等 の 第
四 失 呈 各 揚 ンー シタ ル 化 する こと は た と え 個 人 ” 宮 可
で の 利用 で も 著作 権 法 違反 で す 。

ua ーー mi 因 因 間 因 固着 誠 間 間 症 凍
    `;

    const cleaned = cleanOcrText(userRawOcr);
    expect(cleaned).toContain("ひみつの部活動");
    expect(cleaned).toContain("サークル: ぽむラフライス");
    expect(cleaned).toContain("発行者: ラーヴァル");

    const parsed = parseOkudukeFromText(userRawOcr);
    expect(parsed.title).toBe("ひみつの部活動");
    expect(parsed.circle).toBe("ぽむラフライス");
    expect(parsed.author).toBe("ラーヴァル");
    expect(parsed.publishDate).toBe("2026年09月20日");
    expect(parsed.printingCompany).toBe("booknext");
  });
});
