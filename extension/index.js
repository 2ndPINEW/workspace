const API_BASE = 'http://localhost:9281/'
let recentTmuxWindowName = ''

/** FREE or MANAGE */
let mode = 'MANAGE'

let session = {}

// セッションに必要なタブを復元する
async function restoreSession (sessionName) {
    await saveCurrentSesion()
    const res = await fetch(`${API_BASE}sessions/${sessionName}`)
    if (res.status === 404) {
        createNewSession(sessionName)
        return
    }
    session = await res.json()
    syncSessionTabs()
}

async function createNewSession (sessionName) {
    session = {
        name: sessionName,
        tabs: [
            {
                url: '',
                active: true
            }
        ]
    }
    syncSessionTabs()
}

async function syncSessionTabs () {
    const oldTabs = await chrome.tabs.query({})
    for await (let newTab of session.tabs) {
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
    if (!session.name) {
        return
    }

    session.tabs = await chrome.tabs.query({})

    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    await fetch(`${API_BASE}sessions/${session.name}`, {
        method: 'POST',
        body:  JSON.stringify(session),
        headers
    })
}

function findActiveTmuxWindow() {
    fetch(`${API_BASE}active`).then(async (res) => {
        const json = await res.json()
        const tmuxWindowName = json.window_name
        if (!tmuxWindowName) {
            createNotification('エラー', 'アクティブなtmuxセッションまたはウィンドウが見つかりません')
            return
        }
        if (tmuxWindowName === recentTmuxWindowName) {
            return
        }
        recentTmuxWindowName = tmuxWindowName
        afterTmuxWindowCheckFunc(tmuxWindowName)
    }).catch(e => {
        createNotification('通信エラー', e.toString())
    })
}

function afterTmuxWindowCheckFunc (tmuxWindowName) {
    if (mode === 'free') {
        createNotification('afterTmuxWindowCheckFunc', 'モードがフリー')
        return
    }
    if (session.name === tmuxWindowName) {
        return
    }
    restoreSession(tmuxWindowName)
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

chrome.windows.onFocusChanged.addListener(
    () => {
        findActiveTmuxWindow()
    }
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