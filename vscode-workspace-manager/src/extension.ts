import * as vscode from "vscode";
import { createWorkspaceWindow, fetchActiveWorkspace, fetchWorkspaces, switchWorkspaceWindow, Workspace } from "./util";

export function activate(context: vscode.ExtensionContext) {
  const disposables = [];

  disposables.push(
    vscode.commands.registerCommand(
      "vscodeWorkspaceManager.openWorkspace",
      () => openWorkspacePrompt()
    )
  );

  context.subscriptions.push(...disposables);

  setInterval(() => {
    checkActiveWorkspace();
  }, 1000);

  checkActiveWorkspace();
}

export function deactivate() {}

async function openWorkspacePrompt() {
  const currentWokspaceName = vscode.workspace.name;
  const workspaceEntries = (await fetchWorkspaces()).filter(entry => entry.name !== currentWokspaceName);
  
  if (!workspaceEntries.length || workspaceEntries.length <= 0) {
    vscode.window.showInformationMessage("No workspaces found");
    return;
  }

  const workspaceItems = workspaceEntries.map(
    (entry) =>
      <vscode.QuickPickItem>{
        label: entry.name,
        description: entry.hasTmuxWindow ? '' : '・',
        detail: entry.path
      }
  );

  const options = <vscode.QuickPickOptions>{
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: `Choose a workspace`,
  };

  vscode.window.showQuickPick(workspaceItems, options).then(
    (workspaceItem: vscode.QuickPickItem | undefined) => {
      if (!workspaceItem) {
        return;
      }

      const entry = workspaceEntries.find(
        (entry) => entry.path === workspaceItem.detail
      );

      if (!entry) {
        return;
      }

      switchWorkspace(entry);
    },
    (reason: any) => {}
  );
}

async function checkActiveWorkspace() {
  const targetWorkspace = await fetchActiveWorkspace();
  const currentWokspaceName = vscode.workspace.name;
  if (targetWorkspace.name !== currentWokspaceName) {
    openWorkspace(targetWorkspace.path);
  }
}

function openWorkspace(path: string) {
  const workspaceUri = vscode.Uri.file(path);
  vscode.commands.executeCommand("vscode.openFolder", workspaceUri, false).then(
    () => {},
    () => {}
  );
}

async function switchWorkspace(entry: Workspace) {
  if (entry.hasTmuxWindow) {
    await switchWorkspaceWindow(entry.name);
  } else {
    await createWorkspaceWindow(entry.name);
  }
  await checkActiveWorkspace();
}