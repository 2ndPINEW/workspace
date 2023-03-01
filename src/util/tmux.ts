const windowNameMatcher = /(?<index>[0-9]{1}): (?<name>[\w/:%#\$&\?~\.=\+\-]+)(?<current>\*?) \((?<panel>[0-9]{1}) panes\)/;

interface Window {
  name: string
  active: boolean
}

const sessionName = 'WORKSPACE_MANAGER'

async function isSessionExist (): Promise<boolean> {
  const p = Deno.run({ cmd: ["tmux", "ls"], stdout: "piped" });
  await p.status();
  const stdout = new TextDecoder().decode(await p.output());
  return stdout.includes(sessionName)
}

export async function lsw (): Promise<Window[]> {
  const sessionExist = await isSessionExist()
  if (!sessionExist) {
    throw new Error('管理対象のtmuxセッションがありません')
  }
  const p = Deno.run({ cmd: ["tmux", "lsw"], stdout: "piped" });
  await p.status();
  const stdout = new TextDecoder().decode(await p.output());
  const lines = stdout.split("\n");
  const windows = lines.map(line => {
    const matcheResult = line.match(windowNameMatcher)?.groups

    // 最後に-がつくの正規表現で防げなくない？？
    let name = matcheResult?.name ?? ''
    if (name.endsWith('-')) {
      name = name.slice(0, name.length - 1)
    }
    return {
      name,
      active: line.includes('(active)')
    }
  }).filter(v => !!v.name)
  return windows
}