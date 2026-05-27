// Helpers for the user's currently-selected team workspace.
// Stored client-side under a single localStorage key so all hooks/pages agree.

export const CURRENT_WORKSPACE_KEY = "mediaai.currentWorkspaceId";

export function getCurrentWorkspaceId(): string | null {
  try {
    return localStorage.getItem(CURRENT_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

export function setCurrentWorkspaceId(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_WORKSPACE_KEY, id);
    else localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    // Broadcast so listeners (other tabs / hooks) can react.
    window.dispatchEvent(new CustomEvent("mediaai:workspace-changed", { detail: { id } }));
  } catch {
    /* no-op */
  }
}

export function requireWorkspaceIdOrThrow(): string {
  const id = getCurrentWorkspaceId();
  if (!id) throw new Error("no_workspace_selected");
  return id;
}
