const TST_ID = "treestyletab@piro.sakura.ne.jp";

import { createDebugMenu } from "./debug.js";
import { getDomain, groupBy, sleep } from "./utils/util.js";

// Operate _only_ on the current window, or on all windows, merging all windows'
// tabs into the current window?
const MERGE_ALL_WINDOWS_TOGETHER = false;

const DEBUGGING = true;

if (DEBUGGING) {
  createDebugMenu();
}

/**
 * @typedef {Object} TabGroup タブのグループ
 * @property {string} name グループ名(ドメイン)
 * @property {string[]} tabs
 */

/**
 * @typedef {Object} WindowGroup ウィンドウに含まれるグループ
 * @property {string} windowId ウィンドウID
 * @property {TabGroup[]} tabGroups
 */

/**
 * @typedef {Object} WindowMap ウィンドウIDをキーとしたグループ
 * @property {WindowGroup} windowId
 */

/**
 * 現在のグループ化状態を保持する
 * @type {WindowMap}
 */
const currentGrouping = {};

async function initializeGrouping() {
  // currentGroupingを初期化する
  for (const key in currentGrouping) {
    delete currentGrouping[key];
  }
  // すべてのウィンドウを取得する
  const windows = await browser.windows.getAll();
  // すべてのウィンドウに対してグループ情報を取得する
  for (const window of windows) {
    const tabGroups = await getTabGroups(window.id);
    currentGrouping[window.id] = tabGroups;
  }
}

// getTabGroupsを実装する
async function getTabGroups(windowId) {
  // ウィンドウに含まれるタブを取得する
  const tabs = await browser.tabs.query({ windowId });
  // ウィンドウに含まれるタブをドメインでグループ化する
  const groups = groupBy(tabs, "domain");
  // グループを配列に変換する
  const tabGroups = Object.entries(groups).map(([name, tabs]) => {
    return {
      name,
      tabs,
    };
  });
  // グループを返す
  return tabGroups;
}

//型情報を追加する

/**
 * 現在のウィンドウまたは全てのウィンドウのタブを取得する
 * @returns {Promise<browser.tabs.Tab[]>} タブの配列を返すPromise
 */
async function getTabs() {
  let opts = {};

  if (!MERGE_ALL_WINDOWS_TOGETHER) {
    const currentWindow = await browser.windows.getCurrent();
    opts = { windowId: currentWindow.id };
  }

  const tabs = await browser.tabs.query(opts);
  return tabs;
}

// グループ化から除外する
async function filterTabs(tabs) {
  return tabs
    .filter((t) => !t.pinned) // don't mess with pinned tabs
    .filter((t) => !t.url || !t.url.match(/^moz-extension:/)) // don't reorganize groups
    .filter((t) => t.domain?.length); // maybe couldn't parse URL for some reason
}

async function groupTabs(groupName, tabIds) {
  browser.runtime.sendMessage(TST_ID, {
    type: "group-tabs",
    title: groupName,
    tabs: tabIds,
  });
}

async function groupAllTabs() {
  const tabs = await getTabs();

  const tabsWithdomain = tabs.map((t) => {
    try {
      const url = new URL(t.url);
      return {
        ...t,
        domain: url.hostname,
      };
    } catch (e) {
      // do nothing with bad URLs
      return t;
    }
  });

  const filteredTabs = await filterTabs(tabsWithdomain);
  const groups = groupBy(filteredTabs, "domain");

  const groupsWithMultiple = Object.entries(groups).filter((g) => g[1].length > 1);

  console.log(groupsWithMultiple);

  for (const [domain, group] of groupsWithMultiple) {
    for (const tab of group) {
      await browser.runtime.sendMessage(TST_ID, {
        type: "move-to-start",
        tab: tab.id,
      });
      await sleep(100);
    }

    const tabIds = group.map((t) => t.id);
    console.log(domain, tabIds);
    await groupTabs(domain, tabIds);
    await sleep(1000);
  }
}

// Listeners
// ボタンがクリックされたときに呼び出されるリスナー
browser.browserAction.onClicked.addListener(() => {
  groupAllTabs();
});

// タブが作成されたときに呼び出されるリスナー
browser.tabs.onCreated.addListener((tab) => {
  // 新たに作成されたタブだけを整理する
  organizeTab(tab).catch((e) => console.error(e));
});

// browser.tabs.onUpdated

// browser.tabs.onRemoved

// タブを整理する関数
async function organizeTab(tab) {
  // タブのURLを取得する
  const url = tab.url;

  // タブのURLからドメインを取得する
  const domain = getDomain(url);

  // タブのドメインが現在のグループ化状態に含まれているか確認する
  if (currentGrouping[domain]) {
    // タブのドメインが現在のグループ化状態に含まれている場合
    // タブをグループに追加する
    addTabToGroup(tab.windowId, tab, domain);
  } else {
    // タブのドメインが現在のグループ化状態に含まれていない場合
    // タブをグループに追加する
    addTabToGroup(tab.windowId, tab, domain);
  }
}
