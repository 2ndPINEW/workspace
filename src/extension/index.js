
function check() {
    fetch('http://localhost:9281/').then(async (res) => {
        changeTabGroup(res)
    }).catch(e => {
        createNotification('通信エラー', e.toString())
    })
}

let recentWindowName = ''

async function changeTabGroup (res) {
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
    chrome.tabGroups.query(
        {},
        (groups) => {
            const group = groups.find(group => group.title === windowName)
            if (!group) {
                createNotification('エラー', 'ウィンドウ名と一致するタブグループが見つかりません')
                return
            }
            groups.forEach(group => {
                chrome.tabGroups.update(
                    group.id,
                    {
                        collapsed: true
                    }
                )
            });
            chrome.tabGroups.move(group.id, { index: 1 })
            chrome.tabGroups.update(group.id, { collapsed: false })
            chrome.tabs.query(
                {
                    groupId: group.id
                },
                (tabs) => {
                    chrome.tabs.update(
                        tabs[0].id,
                        {
                            active: true
                        }
                    )
                }
            )
        }
    )
}

/**
 * 通知を表示する
 * @param {string} title 
 * @param {string} message 
 */
function createNotification (title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon.png',
        title: title,
        message: message,
        priority: 1
    });
}

check()
chrome.windows.onFocusChanged.addListener(
    () => check()
)
