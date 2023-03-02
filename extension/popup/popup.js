const API_BASE = 'http://localhost:9281/'

function makeRequestObject (type) {
  return { type }
}

function sendSessionRecheckRequest () {
  const message = makeRequestObject('session-recheck')
  chrome.runtime.sendMessage(message)
}

async function updateSesionList () {
  sendSessionRecheckRequest()
  const sessionsElement = document.querySelector('.sessions')
  sessionsElement.innerHTML = ''

  const res = await fetch(`${API_BASE}workspaces`)
  const workspaces = (await res.json()).workspaces

  workspaces.forEach(workspace => {
    const statusClass = workspace.isTmuxWindowActive ? 'active' : workspace.hasTmuxWindow ? 'ready' : 'disable'

    const sessionElement = document.createElement('div')
    sessionElement.innerHTML = workspace.name
    sessionElement.className = `session-title ${statusClass}`

    sessionElement.addEventListener('click', async () => {
      if (statusClass === 'disable') {
        await fetch(`${API_BASE}tmux/windows/${workspace.name}/create`)
        updateSesionList()
      }

      if (statusClass === 'ready') {
        await fetch(`${API_BASE}tmux/windows/${workspace.name}/switch`)
        updateSesionList()
      }
    })

    sessionsElement.appendChild(sessionElement)
  })
}

async function sendInitWorkspaceRequest (url) {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  await fetch(`${API_BASE}workspace/init`, {
      method: 'POST',
      body:  JSON.stringify({
          httpRepoUrl: url
      }),
      mode: 'no-cors',
      headers
  })
  updateSesionList()
}

async function initWorkspaceFromUrl () {
  const activeTabs = await chrome.tabs.query({ active: true })
  activeTabs.forEach(activeTab => {
    const url = activeTab.url
    if (url) {
      sendInitWorkspaceRequest(url)
    }
  })
}

document.querySelector('.add-button').addEventListener('click', () => {
  initWorkspaceFromUrl()
})

updateSesionList()