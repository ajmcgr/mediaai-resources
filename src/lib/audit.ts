// Centralized audit / workspace-event logging.
// Primary sink: monetization_events (best-effort insert). Falls back to console.
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkspaceId } from "./workspaceContext";

export type WorkspaceAction =
  | "workspace_created"
  | "invite_created"
  | "invite_revoked"
  | "invite_accepted"
  | "member_role_changed"
  | "export_triggered"
  | "reveal_email_triggered"
  | "reveal_linkedin_triggered"
  | "search_result_marked_relevant"
  | "search_result_marked_not_relevant";

type Meta = Record<string, unknown>;

export async function logWorkspaceEvent(
  action: WorkspaceAction,
  workspaceId: string | null | undefined,
  metadata: Meta = {}
) {
  const ws = workspaceId ?? getCurrentWorkspaceId();
  const payload = {
    action,
    workspace_id: ws,
    metadata: { ...metadata, workspace_id: ws, ts: new Date().toISOString() },
  };

  // Best-effort insert; ignore schema mismatch silently.
  try {
    const { error } = await (supabase as any)
      .from("monetization_events")
      .insert(payload);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[audit] monetization_events insert failed:", error.message, payload);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[audit] logWorkspaceEvent error:", e, payload);
  }
}
