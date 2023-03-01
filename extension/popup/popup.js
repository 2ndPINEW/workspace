const API_BASE = 'http://localhost:9281/'

async function updateSesionList () {
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

updateSesionList()