
async function getMode () {
  return (await chrome.storage.local.get('workspaceMode'))['workspaceMode'] || MANAGE_MODE_KEY
}

async function getSession () {
  return (await chrome.storage.local.get('workspaceSession'))['workspaceSession'] || {}
}

async function updateView () {
  const mode = await getMode()
  const modeElement = document.querySelector('.mode')
  modeElement.innerHTML = mode

  const session = await getSession()
  const sessionElement = document.querySelector('.session')
  sessionElement.innerHTML = session.name
}

updateView()