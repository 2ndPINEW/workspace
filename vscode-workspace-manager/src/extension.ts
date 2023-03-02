// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import axios from 'axios';

const API_BASE = "http://localhost:9281/";

export function activate() {
  setInterval(() => {
		checkActiveWorkspace();
  }, 1000);

	checkActiveWorkspace();
}

export function deactivate() {}

async function checkActiveWorkspace () {
	const res = await axios.get(`${API_BASE}workspaces/active`);
	const json = await res.data;
	const targetWorkspace = json.workspace;
	const currentWokspaceName = vscode.workspace.name;
	if (targetWorkspace.name !== currentWokspaceName) {
		openWorkspace(targetWorkspace.path);
	}
}

function openWorkspace(path: string) {
  const workspaceUri = vscode.Uri.file(path);
  vscode.commands.executeCommand("vscode.openFolder", workspaceUri, false);
}
