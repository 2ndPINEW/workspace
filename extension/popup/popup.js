
async function getMode () {
  return (await chrome.storage.local.get('workspaceMode'))['workspaceMode'] || MANAGE_MODE_KEY
}

async function getSession () {
  return (await chrome.storage.local.get('workspaceSession'))['workspaceSession'] || {}
}

async function updateSesionList () {
  const sessionsElement = document.querySelector('.sessions')
  sessionsElement.innerHTML = ''
  const nowSession = await getSession()

  const allSesions = await chrome.storage.local.get(null)
  const allSesionNames = Object.keys(allSesions).filter(key => key !== 'workspaceSession' && key !== 'workspaceMode')
  allSesionNames.forEach(sessionName => {
    const sessionElement = document.createElement('div')
    sessionElement.innerHTML = sessionName
    sessionElement.className = sessionName === nowSession.name ? 'session-title active' : 'session-title'
    sessionsElement.appendChild(sessionElement)
  })
}

async function updateTabList () {
  const nowSession = await getSession()
  const tabsElement = document.querySelector('.tabs')
  tabsElement.innerHTML = ''

  nowSession.tabs.forEach(tab => {
    const tabElement = document.createElement('div')
    tabElement.innerHTML = tab.title
    tabElement.className = 'tab-title'
    tabsElement.appendChild(tabElement)
  })
}

updateSesionList()
updateTabList()
