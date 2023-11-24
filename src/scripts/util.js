export function getDomain(url) {
  // URLを解析する
  const urlObject = new URL(url);
  // ホスト名を返す
  return urlObject.hostname;
}

/**
 * タブを指定されたキーでグループ化します。
 * @param {Array} tabs - グループ化するタブの配列
 * @param {string} key - グループ化に使用するキー
 * @returns {Object} キーをプロパティとするグループ化されたタブのオブジェクト
 */
export function groupBy(tabs, key) {
  // 空のオブジェクトを初期値としてreduceを開始します。
  return tabs.reduce(function (accumulator, currentTab) {
    // currentTabから指定されたキーの値を取得します。
    const keyValue = currentTab[key];

    // キーの値がまだ累積オブジェクトに存在しない場合、新たに空の配列を作成します。
    if (!accumulator[keyValue]) {
      accumulator[keyValue] = [];
    }

    // キーの値に対応する配列に現在のタブを追加します。
    accumulator[keyValue].push(currentTab);

    // 累積オブジェクトを次のステップに渡します。
    return accumulator;
  }, {});
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
