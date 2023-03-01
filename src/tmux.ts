const windowNameMatcher = /(?<index>[0-9]{1}): (?<name>[\w/:%#\$&\?~\.=\+\-]+)(?<current>\*?) \((?<panel>[0-9]{1}) panes\)/;

interface Window {
  name: string
  active: boolean
}

export async function lsw (): Promise<Window[]> {
  const p = Deno.run({ cmd: ["tmux", "lsw"], stdout: "piped" });
  await p.status();
  const stdout = new TextDecoder().decode(await p.output());
  const lines = stdout.split("\n");
  const windows = lines.map(line => {
    const matcheResult = line.match(windowNameMatcher)?.groups
    return {
      name: matcheResult?.name ?? '',
      active: line.includes('(active)')
    }
  }).filter(v => !!v.name)
  return windows
}