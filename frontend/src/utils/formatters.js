/**
 * 日付を「YYYY/MM/DD HH:mm」形式に変換する
 * @param {string | Date} dateInput
 * @returns {string}
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 長いテキストを「...」で省略する
 * @param {string} text 対象のテキスト
 * @param {number} maxLength 表示する最大文字数 (デフォルト10)
 * @returns {string}
 */
export const truncateText = (text, maxLength = 10) => {
  if (!text) return "-";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

/**
 * ミスキー情報（JSON文字列 or オブジェクト）を「k(2), a(1)」形式にする
 * @param {string | object} missedKeysInput
 * @returns {string}
 */
export const formatMissedKeys = (missedKeysInput) => {
  if (!missedKeysInput) return "-";

  let missedKeys = missedKeysInput;

  // DBからは「JSON文字列」で来る場合があるので、その時はパースする
  if (typeof missedKeysInput === 'string') {
    try {
      missedKeys = JSON.parse(missedKeysInput);
    } catch (e) {
      console.warn('MissedKeys Parse Error:', e);
      return "Error";
    }
  }

  // キーがない（空オブジェクト）の場合
  if (!missedKeys || Object.keys(missedKeys).length === 0) {
    return "-";
  }

  // 整形: { a: 2, k: 1 } -> "a(2), k(1)"
  return Object.entries(missedKeys)
    .map(([key, count]) => `${key}(${count})`)
    .join(", ");
};