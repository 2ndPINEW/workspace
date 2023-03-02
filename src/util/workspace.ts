import { workspaces } from "./vscode.ts";

export async function switchWindow(name: string) {
  const vscodeWorkspaces = await workspaces();
  const targetWorkspace = vscodeWorkspaces.find(
    (vscodeWorkspace) => vscodeWorkspace.name === name
  );
  if (!targetWorkspace) {
    throw new Error(
      "VSCodeのワークスペースが存在しないので、tmuxウィンドウを切り替えできません"
    );
  }
  if (!targetWorkspace.hasTmuxWindow) {
    throw new Error("tmuxウィンドウがないので切り替えできません");
  }
  const add = Deno.run({
    cmd: ["tmux", "selectw", "-t", name],
    stdout: "piped",
  });
  await add.status();
}

/** 渡した名前のワークスペースを作る */
export async function createWindow(name: string) {
  const vscodeWorkspaces = await workspaces();
  const targetWorkspace = vscodeWorkspaces.find(
    (vscodeWorkspace) => vscodeWorkspace.name === name
  );
  if (!targetWorkspace) {
    throw new Error(
      "VSCodeのワークスペースが存在しないので、tmuxウィンドウを追加できません"
    );
  }
  if (targetWorkspace.hasTmuxWindow) {
    throw new Error("すでにtmuxウィンドウが存在します");
  }
  const add = Deno.run({
    cmd: ["zsh", "src/shell/add_window.sh", name, targetWorkspace.path],
    stdout: "piped",
  });
  await add.status();
}

// git@github.com:2ndPINEW/workspace.git
const gitSshMatcher = /git@(?<host>.+):(?<user>.+)\/(?<repo>.+)\.git/;
// https://github.com/2ndPINEW/workspace
const gitHttpMatcher = /https:\/\/(?<host>.+)\/(?<user>.+)\/(?<repo>.+)/;

interface InitWorkspaceParams {
  sshRepoUrl?: string;
  httpRepoUrl?: string;
}
export async function initWorkspace(params: InitWorkspaceParams) {
  const group = params.sshRepoUrl
    ? params.sshRepoUrl.match(gitSshMatcher)?.groups
    : params.httpRepoUrl
    ? params.httpRepoUrl.match(gitHttpMatcher)?.groups
    : undefined;
  if (!group) {
    throw new Error("urlのパースができません");
  }
  if (group.host !== 'github.com') {
    throw new Error('非対応のホストです')
  }
  const sshUrl = params.sshRepoUrl
    ? params.sshRepoUrl
    : params.httpRepoUrl
    ? `git@${group.host}:${group.user}/${group.repo}.git`
    : undefined;
  if (!sshUrl) {
    throw new Error('sshurl 作れん')
  }
  const name = group.repo;

  const vscodeWorkspaces = await workspaces();
  const targetWorkspace = vscodeWorkspaces.find(
    (vscodeWorkspace) => vscodeWorkspace.name === name
  );
  if (targetWorkspace) {
    return await createWindow(name);
  }

  const ghqGet = Deno.run({ cmd: ["ghq", "get", sshUrl], stdout: "piped" });
  const ghqStatus = await ghqGet.status();
  if (ghqStatus.code !== 0) {
    throw new Error("ghq get error");
  }
  const savePath = `../../../${group.host}/${group.user}/${group.repo}`;
  const codeWorkspace = `{
    "folders": [
      {
        "path": "${savePath}"
      }
    ],
    "settings": {}
  }
  `;
  await Deno.writeTextFile(`${name}.code-workspace`, codeWorkspace);

  const add = Deno.run({
    cmd: ["zsh", "src/shell/add_window.sh", name, savePath],
    stdout: "piped",
  });
  await add.status();
}

/**
 * 利用シーンを考える
 *
 * パターン1
 * 新規リポジトリのクローン
 * クローンする
 * .code-workspaceを作る
 * tmuxのウィンドウを足す
 * VSCodeをそのワークスペースに切り替える
 *
 * パターン2
 * 既存のtmuxウィンドウがないワークスペースを開く
 * tmuxのウィンドウを足す
 * VSCodeをそのワークスペースに切り替える
 *
 * パターン3
 * tmuxウィンドウが存在するワークスペースに切り替える
 * VSCodeのワークスペースを切り替える
 */
