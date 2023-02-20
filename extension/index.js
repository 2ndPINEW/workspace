const API_BASE = 'http://localhost:9281/'
let recentWindowName = ''

// 拡張機能がタブを作成している間はonCreatedでしてる処理が実行されないようにする
let internalTabCreatingModeStartUnixTimeMs = 0

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
    // 名前がfreeのタブグループがアクティブな場合は何もしないための処理
    const freeGroups = await chrome.tabGroups.query({ collapsed: false, title: 'free' })
    let hasActiveTabInFreeGroup = false
    for await (const freeGroup of freeGroups) {
        const tabsInFreeGroup = await chrome.tabs.query({ groupId: freeGroup.id })
        if (tabsInFreeGroup.some(tab => tab.active === true)) {
            hasActiveTabInFreeGroup = true
        }
    }
    if (hasActiveTabInFreeGroup) {
        return
    }
    const groups = await chrome.tabGroups.query({})
    const group = groups.find(group => group.title === groupName)
    if (!group) {
        createNewTabGroup(groupName)
        // createNotification('タブグループ', `${groupName}を作成しました`)
        return
    }
    for await (const group of groups) {
        await chrome.tabGroups.update(group.id, { collapsed: true })
    }
    await chrome.tabGroups.update(group.id, { collapsed: false })
    const tabsInGroup = await chrome.tabs.query({ groupId: group.id })
    const hasActiveTabInGroup = tabsInGroup.some(tab => tab.active === true)
    if (!hasActiveTabInGroup) {
        await chrome.tabs.update(tabsInGroup[0].id, { active: true })
    }
}

/**
 * 新しいタブグループを作成する
 */
function createNewTabGroup(groupName) {
    fetch(`${API_BASE}fallback`).then(async (res) => {
        const json = await res.json()
        const tabs = json[groupName]?.tabs ?? json.default?.tabs ?? []
        const tabIds = []
        const groups = await chrome.tabGroups.query({})
        for await (const group of groups) {
            await chrome.tabGroups.update(group.id, { collapsed: true })
        }
        for await (const tab of tabs) {
            const option = tab ? { url: tab } : {}
            internalTabCreatingModeStartUnixTimeMs = Date.now()
            tabIds.push((await chrome.tabs.create(option)).id)
        }
        const groupId = await chrome.tabs.group({ tabIds })
        await chrome.tabGroups.update(groupId, { title: groupName })
    }).catch(e => {
        createNotification('通信エラー', e.toString())
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
    const groups = await chrome.tabGroups.query({})
    for await (const group of groups) {
        const tabsInGroup = await chrome.tabs.query({ groupId: group.id })
        const hasActiveTabInGroup = tabsInGroup.some(tab => tab.active === true)
        if (hasActiveTabInGroup) {
            activeTabGroupId = group.id
        }
    }
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
    async (tab) => {
        if (Date.now() - internalTabCreatingModeStartUnixTimeMs > 500) {
            const groupId = activeTabGroupId || (await chrome.tabGroups.query({ collapsed: false }))[0].id
            chrome.tabs.group({ groupId, tabIds: [tab.id] })
        }
    }
)
