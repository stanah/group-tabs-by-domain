// このファイルはデバッグ用のスクリプトです。

/**
 * 配列をシャッフルします。
 * @param {Array} array - シャッフルする配列
 * @returns {Array} シャッフルされた配列
 */
export function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // 配列が残っている間、シャッフルを続けます
  while (0 !== currentIndex) {
    // 残っている要素からランダムに1つを選びます
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // 現在の要素と選んだ要素を交換します
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// デバッグ用にタブをランダムな順番に並び替える
async function shuffleTabs() {
  // 現在のウィンドウを取得する
  const window = await browser.windows.getCurrent();
  // ウィンドウに含まれるタブを取得する
  const tabs = await browser.tabs.query({ windowId: window.id });
  // タブをランダムな順番に並び替える
  const shuffledTabs = shuffle(tabs);
  // タブを順番に移動する
  for (const [index, tab] of shuffledTabs.entries()) {
    await browser.tabs.move(tab.id, { index });
  }
}

// デバッグ用のメニューを作成する
export function createDebugMenu() {
  browser.contextMenus.create({
    id: "my-menu-item",
    title: "[debug] shuffle tabs",
    contexts: ["all"],
    onclick: function (info, tab) {
      shuffleTabs();
    },
  });
}
