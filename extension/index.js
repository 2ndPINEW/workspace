// 書き捨てだからJSでいいやって思ったけど辛くね
// 1ファイルJSの綺麗な書き方わからん

const API_BASE = 'http://localhost:9281/'
const FREE_MODE_KEY = 'FREE'
const MANAGE_MODE_KEY = 'MANAGE'

async function setMode (mode) {
    await chrome.storage.local.set({ workspaceMode: mode })
}

async function getMode () {
    return (await chrome.storage.local.get('workspaceMode'))['workspaceMode'] || MANAGE_MODE_KEY
}

async function setSession (session) {
    await chrome.storage.local.set({ workspaceSession: session })
    await updateBadge()
}

async function getSession () {
    return (await chrome.storage.local.get('workspaceSession'))['workspaceSession'] || {}
}

async function switchMode () {
    const mode = await getMode() === MANAGE_MODE_KEY ? FREE_MODE_KEY : MANAGE_MODE_KEY
    await setMode(mode)
    findActiveTmuxWindow()

    await updateBadge()
}

async function moveCurrentTabToFreeSession () {
    const activeTabs = await chrome.tabs.query({ active: true })
    const activeTabIds = activeTabs.map(tab => tab.id)
    await chrome.tabs.remove(activeTabIds)
    await saveCurrentSesion()

    const freeSession = (await chrome.storage.local.get(FREE_MODE_KEY))[FREE_MODE_KEY]
    activeTabs.forEach(tab => {
        freeSession.tabs.push(tab)
    })
    await chrome.storage.local.set({ [freeSession.name]: freeSession })
    createNotification('タブ移動', '選択中のタブをフリーセッションに移動しました')
}

chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case "switchMode":
            switchMode()
            break;
        case "tabMove":
            moveCurrentTabToFreeSession()
            break;
    }
});

// セッションに必要なタブを復元する
async function restoreSession (sessionName) {
    await saveCurrentSesion()
    const nextSession = (await chrome.storage.local.get(sessionName))[sessionName]
    if (!nextSession) {
        createNewSession(sessionName)
        return
    }

    // 次のセッションと今開いているタブの内容が同じ場合
    // 内部で保持してるオブジェクトだけ更新する
    const tabs = await chrome.tabs.query({})
    if (tabs?.length === nextSession.tabs.length) {
        let isSame = true
        tabs.forEach((tab, i) => {
            if (tab.url !== nextSession.tabs[i].url) {
                isSame = false
            }
        })
        if (isSame) {
            await setSession(nextSession)
            return
        }
    }

    await setSession(nextSession)
    syncSessionTabs()
}

async function createNewSession (sessionName) {
    setSession({
        name: sessionName,
        tabs: [
            {
                url: '',
                active: true
            }
        ]
    })
    syncSessionTabs()
}

async function syncSessionTabs () {
    const oldTabs = await chrome.tabs.query({})
    for await (let newTab of (await getSession()).tabs) {
        if (newTab.url) {
            await chrome.tabs.create({ url: newTab.url, active: newTab.active })
        } else {
            await chrome.tabs.create({ active: newTab.active })
        }
    }
    const oldTabIds = oldTabs.map(oldTab => oldTab.id)
    await chrome.tabs.remove(oldTabIds)
}

async function saveCurrentSesion () {
    const session = await getSession()
    if (!session.name) {
        return
    }

    session.tabs = await chrome.tabs.query({})
    await chrome.storage.local.set({ [session.name]: session })
}

function findActiveTmuxWindow() {
    fetch(`${API_BASE}active`).then(async (res) => {
        const json = await res.json()
        const tmuxWindowName = json.window_name
        if (!tmuxWindowName) {
            createNotification('エラー', 'アクティブなtmuxセッションまたはウィンドウが見つかりません')
            return
        }
        await afterTmuxWindowCheckFunc(tmuxWindowName)
        await updateBadge()
    }).catch(e => {
        createNotification('通信エラー', e.toString())
    })
}

async function afterTmuxWindowCheckFunc (tmuxWindowName) {
    const mode = await getMode()
    const session = await getSession()
    if (mode === FREE_MODE_KEY && session.name !== FREE_MODE_KEY) {
        restoreSession(FREE_MODE_KEY)
        return
    }
    if (mode === FREE_MODE_KEY && session.name === FREE_MODE_KEY) {
        return
    }
    if (session.name === tmuxWindowName) {
        return
    }
    restoreSession(tmuxWindowName)
}

async function updateBadge () {
    const mode = await getMode()
    const session = await getSession()
    if (mode === FREE_MODE_KEY) {
        await chrome.action.setBadgeText({ text: mode })
    } else {
        await chrome.action.setBadgeText({ text: session.name })
    }
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

findActiveTmuxWindow()

chrome.windows.onFocusChanged.addListener(
    () => findActiveTmuxWindow()
)

chrome.tabs.onActivated.addListener(
    () => saveCurrentSesion()
)

chrome.tabs.onRemoved.addListener(
    () => saveCurrentSesion()
)

chrome.tabs.onCreated.addListener(
    () => saveCurrentSesion()
)

chrome.tabs.onUpdated.addListener(
    () => saveCurrentSesion()
)

chrome.action.setBadgeBackgroundColor(
    {color: '#FFFFFF'}
)

chrome.action.setBadgeTextColor(
    {color: '#000000'}
)