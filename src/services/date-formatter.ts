/**
 * 多様な日付文字列（例: 2026年8月16日, 2026/8/16, 2026.8.16）を
 * HTML input[type="date"] で扱える YYYY-MM-DD 形式に正規化する
 */
export function normalizeDateToInput(rawDate: string): string {
  if (!rawDate) return "";

  const trimmed = rawDate.trim();

  // すでに YYYY-MM-DD 形式の場合
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY年M月D日 or YYYY/M/D or YYYY.M.D or YYYY-M-D
  const matchFull = trimmed.match(/^(\d{4})[年/.-](\d{1,2})[月/.-](\d{1,2})日?$/);
  if (matchFull) {
    const year = matchFull[1];
    const month = matchFull[2].padStart(2, "0");
    const day = matchFull[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // YYYY年M月 or YYYY/M (日が省略されている場合は 01 日とする)
  const matchMonth = trimmed.match(/^(\d{4})[年/.-](\d{1,2})月?$/);
  if (matchMonth) {
    const year = matchMonth[1];
    const month = matchMonth[2].padStart(2, "0");
    return `${year}-${month}-01`;
  }

  return "";
}

/**
 * 表示用または保存用の日付フォーマット
 */
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
  }
  return dateStr;
}
