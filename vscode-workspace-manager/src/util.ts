import axios from "axios";

const API_BASE = "http://localhost:9281/";

export interface Workspace {
  name: string;
  path: string;
  hasTmuxWindow: boolean;
  isTmuxWindowActive: boolean;
  codeWorkspaceFilePath: string;
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await axios.get(`${API_BASE}workspaces`);
  return await res.data.workspaces;
}

export async function fetchActiveWorkspace(): Promise<Workspace> {
  const res = await axios.get(`${API_BASE}workspaces/active`);
  return await res.data.workspace;
}

export async function createWorkspaceWindow(name: string): Promise<void> {
  await axios.get(`${API_BASE}tmux/windows/${name}/create`);
}

export async function switchWorkspaceWindow(name: string): Promise<void> {
  await axios.get(`${API_BASE}tmux/windows/${name}/switch`);
}
