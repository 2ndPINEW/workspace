
let recentWindowName = ''

function check() {
    fetch('http://localhost:9281/').then(async (res) => {
        const json = await res.json()
        const windowName = json.window_name
        if (!windowName) {
            console.log('no window name')
            return
        }
        if (windowName === recentWindowName) {
            return
        }
        recentWindowName = windowName
        chrome.tabGroups.query(
            {},
            (groups) => {
                console.log('callback', groups)
                const group = groups.find(group => group.title === windowName)
                if (!group) {
                    console.log('no group')
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
    })
}

check()

chrome.windows.onFocusChanged.addListener(
    () => {
        check()
    }
  )