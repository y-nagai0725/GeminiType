// =========================================================================
// 汎用フォーマット関数群
// =========================================================================

/**
 * 日付を「YYYY/MM/DD HH:mm」形式に変換する
 * @param {string | Date} dateInput 日付データ
 * @returns {string} 「YYYY/MM/DD HH:mm」形式の文字列。無効なデータの場合は "-"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "-";

  const date = new Date(dateInput);

  // 万が一「Invalid Date (無効な日付)」が作られた場合のガード
  if (Number.isNaN(date.getTime())) return "-";

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
 * @returns {string} 最大文字数を超過した部分を省略したテキスト
 */
export const truncateText = (text, maxLength = 10) => {
  if (!text) return "-";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

/**
 * ミスキー情報（JSON文字列 or オブジェクト）を「K(2), A(1)」形式にする
 * @param {string | Record<string, number>} missedKeysInput ミスキー情報（JSON文字列 or オブジェクト）
 * @returns {string} 「K(2), A(1)」形式の文字列。データがない場合は "NONE"
 */
export const formatMissedKeys = (missedKeysInput) => {
  if (!missedKeysInput) return "NONE";

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
    return "NONE";
  }

  // 整形: { a: 2, k: 1 } -> "A(2), K(1)"
  return Object.entries(missedKeys)
    .map(([key, count]) => `${key.toUpperCase()}(${count})`)
    .join(", ");
};