const API_BASE = 'http://localhost:9281/'
let recentWindowName = ''

function check() {
    fetch(`${API_BASE}active`).then(async (res) => {
        const json = await res.json()
        const windowName = json.window_name
        if (!windowName) {
            createNotification('エラー', 'アクティブなtmuxセッションまたはウィンドウが見つかりません')
            return
        }
        if (windowName === recentWindowName) {
            return
        }
        recentWindowName = windowName
        await changeTabGroup(windowName)
    }).catch(e => {
        createNotification('通信エラー', e.toString())
    })
}

async function changeTabGroup(groupName) {
    const groups = await chromeTabGroupsQuery({})
    const group = groups.find(group => group.title === groupName)
    if (!group) {
        createNewTabGroup(groupName)
        // createNotification('タブグループ', `${groupName}を作成しました`)
        return
    }
    for await (const group of groups) {
        await chromeTabGroupsUpdate(group.id, { collapsed: true })
    }
    await chromeTabGroupsUpdate(group.id, { collapsed: false })
    const tabsInGroup = await chromeTabsQuery({ groupId: group.id })
    const hasActiveTabInGroup = tabsInGroup.some(tab => tab.active === true)
    if (hasActiveTabInGroup) {
        // createNotification('タブグループの移動をキャンセルしました', `${groupName}内のタブをすでに開いています`)
    } else {
        // createNotification('タブグループを移動しました', `${groupName}に移動しました`)
        await chromeTabsUpdate(tabsInGroup[0].id, { active: true })
    }
}

// 拡張機能がタブを作成している間はonCreatedでしてる処理が実行されないようにする
let internalTabCreatingModeStartUnixTimeMs = 0

/**
 * 新しいタブグループを作成する
 */
function createNewTabGroup(groupName) {
    fetch(`${API_BASE}fallback`).then(async (res) => {
        const json = await res.json()
        const tabs = json[groupName]?.tabs ?? json.default?.tabs ?? []
        const tabIds = []
        internalTabCreatingModeStartUnixTimeMs = Date.now()
        const groups = await chromeTabGroupsQuery({})
        for await (const group of groups) {
            await chromeTabGroupsUpdate(group.id, { collapsed: true })
        }
        for await (const tab of tabs) {
            const option = tab ? { url: tab } : {}
            tabIds.push((await chromeTabsCreate(option)).id)
        }
        const groupId = await chromeTabsGroup({ tabIds })
        await chromeTabGroupsUpdate(groupId, { title: groupName })
    }).catch(e => {
        createNotification('通信エラー', e.toString())
    })
}

/** ---------------------------------------------- */
/** ChromeのAPIがコールバック地獄だからpromiseにする */
/** ---------------------------------------------- */

/**
 * タブを作る
 * https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
 */
function chromeTabsCreate(option) {
    return new Promise((resolve, _) => {
        chrome.tabs.create(
            option,
            (tab) => {
                resolve(tab)
            })
    });
}

/**
 * タブを探す
 * https://developer.chrome.com/docs/extensions/reference/tabs/#method-query
 */
function chromeTabsQuery(option) {
    return new Promise((resolve) => {
        chrome.tabs.query(option, (tabs) => resolve(tabs))
    })
}

/**
 * タブを操作する
 * https://developer.chrome.com/docs/extensions/reference/tabs/#method-update
 */
function chromeTabsUpdate(tabId, option) {
    return new Promise((resolve) => {
        chrome.tabs.update(tabId, option, (tabs) => resolve(tabs))
    })
}

/**
 * タブをグループにする
 * https://developer.chrome.com/docs/extensions/reference/tabs/#method-group
 */
function chromeTabsGroup(option) {
    return new Promise((resolve) => {
        chrome.tabs.group(
            option,
            (groupId) => {
                resolve(groupId)
            }
        )
    })
}

/**
 * タブグループを更新する
 * https://developer.chrome.com/docs/extensions/reference/tabGroups/#method-update
 */
function chromeTabGroupsUpdate(groupId, option) {
    return new Promise((resolve) => {
        chrome.tabGroups.update(
            groupId,
            option,
            (group) => resolve(group)
        )
    })
}

/**
 * タブグループを移動する
 * https://developer.chrome.com/docs/extensions/reference/tabGroups/#method-move
 */
function chromeTabGroupsMove(groupId, option) {
    return new Promise((resolve) => {
        chrome.tabGroups.move(groupId, option, (group) => resolve(group))
    })
}

/**
 * タブグループを探す
 * https://developer.chrome.com/docs/extensions/reference/tabGroups/#method-query
 */
function chromeTabGroupsQuery(option) {
    return new Promise((resolve) => {
        chrome.tabGroups.query(option, (groups) => resolve(groups))
    })
}


/**
 * 通知を表示する
 * @param {string} title 
 * @param {string} message 
 */
function createNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon.png',
        title: title,
        message: message,
        priority: 1
    });
}

// アクティブなタブグループのIDを保持しておく
let activeTabGroupId = ''
async function findActiveTabGrup() {
    const groups = await chromeTabGroupsQuery({})
    for await (const group of groups) {
        const tabsInGroup = await chromeTabsQuery({ groupId: group.id })
        const hasActiveTabInGroup = tabsInGroup.some(tab => tab.active === true)
        if (hasActiveTabInGroup) {
            activeTabGroupId = group.id
            await switchTmuxWindow(group.title)
        }
    }
}

// tmux側のウィンドウを選択中のタブグループの名前と一致するものに切り替える
async function switchTmuxWindow (windowName) {
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    await fetch(`${API_BASE}switch`, {
        method: 'POST',
        body:  JSON.stringify({
            "window_name": windowName
        }),
        headers
    })
}

check()
findActiveTabGrup()

chrome.windows.onFocusChanged.addListener(
    () => {
        check()
        findActiveTabGrup()
    }
)

chrome.tabs.onActivated.addListener(
    () => findActiveTabGrup()
)

chrome.tabs.onRemoved.addListener(
  () => findActiveTabGrup()
)

// 新規タブを作った時に、今アクティブなタブグループの中に入れ込む
chrome.tabs.onCreated.addListener(
    (tab) => {
        if (Date.now() - internalTabCreatingModeStartUnixTimeMs > 500) {
            chromeTabsGroup({ groupId: activeTabGroupId, tabIds: [tab.id] })
        }
    }
)