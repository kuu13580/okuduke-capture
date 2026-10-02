import type { OkudukeRecord } from "../types.ts";

export interface ParsedOkuduke {
  title: string;
  circle: string;
  author: string;
  publishDate: string;
  printingCompany: string;
  memo: string;
  rawText: string;
}

export function cleanOcrText(rawText: string): string[] {
  const lines = rawText.split(/\r?\n/);
  const cleanedLines: string[] = [];
  const jpChar = "[\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFFー]";

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // 罫線・記号のみの行を除外
    if (/^[一ニ\-_=~*#+/\s|()（）「」『』\\.,:;!?！？]{2,}$/.test(line)) {
      continue;
    }
    const borderSymbolCount = (line.match(/[一ニ\-_=~*#|/\\（）()]/g) || []).length;
    if (line.length > 2 && borderSymbolCount / line.length >= 0.35) {
      continue;
    }

    // OCRの文字化けパターンを除外
    if (/(?:因|固着|誠|症|凍).*(?:因|固着|誠|症|凍)/.test(line)) {
      continue;
    }

    // 著作権・複写禁止の定型文を除外
    if (
      /コピー|デジタル化|シタル化|スキャン|無断|複[写租]|転載|著作権|代行業|第三者|法律|違反|禁じ|例外を除き|個人.*(?:宮可|利用)/.test(
        line,
      )
    ) {
      continue;
    }

    // 表記ゆれの正規化
    line = line.replace(/サー\s*クル(?:\s*名)?/g, "サークル: ");
    line = line.replace(/発\s*行\s*者/g, "発行者: ");
    line = line.replace(/著\s*者/g, "著者: ");
    line = line.replace(/連\s*絡\s*先/g, "連絡先: ");
    line = line.replace(/印\s*刷(?:\s*所)?/g, "印刷所: ");

    // 日本語文字間のスペース混入を結合
    for (let i = 0; i < 4; i++) {
      line = line.replace(new RegExp(`(${jpChar})\\s+(${jpChar})`, "g"), "$1$2");
    }

    // 日付表記の正規化
    line = line.replace(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[晶目日白]/g, "$1年$2月$3日");
    line = line.replace(/(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/g, "$1.$2.$3");
    line = line.replace(/([：:])\s+/g, "$1 ");

    line = line.trim();
    if (line.length > 0) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines;
}

export function parseOkudukeFromText(rawText: string): ParsedOkuduke {
  const lines = cleanOcrText(rawText);

  let title = "";
  let circle = "";
  let author = "";
  let publishDate = "";
  let printingCompany = "";
  const memos: string[] = [];

  const dateRegex = /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}[./-]\d{1,2}[./-]\d{1,2})/;

  for (const line of lines) {
    if (!publishDate && dateRegex.test(line)) {
      const match = line.match(dateRegex);
      if (match) {
        publishDate = match[1];
      }
    }

    const circleMatch = line.match(/^(?:サークル(?:名)?|発行サークル|circle)[：:\s_]*(.+)$/i);
    if (circleMatch && !circle) {
      circle = circleMatch[1].trim();
      continue;
    }

    const authorMatch = line.match(/^(?:発行者|著者|執筆|作|著|author)[：:\s_]*(.+)$/i);
    if (authorMatch && !author) {
      author = authorMatch[1].trim();
      continue;
    }

    const printMatch = line.match(/^(?:印刷(?:所)?|プリント|printed\s+by)[：:\s_]*(.+)$/i);
    if (printMatch && !printingCompany) {
      let company = printMatch[1].trim();
      company = company.replace(/^[_・\s]+/, "").replace(/[\s_]*(?:様|御中)$/, "");
      printingCompany = company.trim();
      continue;
    }

    const titleMatch = line.match(/^(?:タイトル|誌名|書名|title)[：:\s_]*(.+)$/i);
    if (titleMatch && !title) {
      title = titleMatch[1].trim();
      continue;
    }

    if (/初版|再版|コミックマーケット|コミケ|コミティア|c\d{2,3}|comitia/i.test(line)) {
      memos.push(line);
    }
  }

  // ラベル未指定時は先頭の有効行をタイトルとして推定
  if (!title && lines.length > 0) {
    for (const line of lines) {
      if (
        !dateRegex.test(line) &&
        !/^(?:サークル|発行|著者|執筆|印刷|連絡先|mail|twitter|x\.com|奥付|了\s*!)/i.test(line) &&
        !line.includes("@") &&
        line.length > 1
      ) {
        title = line;
        break;
      }
    }
  }

  return {
    title,
    circle,
    author,
    publishDate,
    printingCompany,
    memo: memos.join(" / "),
    rawText,
  };
}

export function createRecordFromParsed(parsed: ParsedOkuduke): OkudukeRecord {
  return {
    id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: parsed.title,
    circle: parsed.circle,
    author: parsed.author,
    publishDate: parsed.publishDate,
    printingCompany: parsed.printingCompany,
    memo: parsed.memo,
    scannedAt: new Date().toLocaleString("ja-JP"),
  };
}
