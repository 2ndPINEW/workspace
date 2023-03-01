import { lsw } from "./tmux.ts";

export async function workspaces() {
  const path = "./";
  const files = [];

  function makeAbsolutePath(path: string) {
    return path.startsWith("/Users") || path.startsWith("~/")
      ? path
      : `${Deno.cwd()}/${path}`;
  }

  const tmuxWindows = await lsw();

  for await (const f of Deno.readDir(path)) {
    if (!f.isDirectory && f.name.endsWith(".code-workspace")) {
      const json = JSON.parse(await Deno.readTextFile(path + f.name));
      const name = f.name.substring(0, f.name.indexOf("."));
      files.push({
        name,
        path: makeAbsolutePath(json.folders[0].path),
        hasTmuxWindow: tmuxWindows.some(tmuxWindow => tmuxWindow.name === name)
      });
    }
  }
  return files;
}
