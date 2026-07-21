import { useNavigate } from "react-router-dom";
import { Users, ChevronDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamWorkspaces, useCurrentWorkspace } from "@/hooks/useTeams";

export default function WorkspaceDropdown() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: workspaces, isLoading } = useTeamWorkspaces(user?.id);
  const { workspace, select } = useCurrentWorkspace(workspaces);

  const label = workspace?.name ?? "Workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          aria-label="Workspace menu"
        >
          <Users className="h-4 w-4 text-gray-600" />
          <span className="max-w-[140px] truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {isLoading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading…</div>
        ) : !workspaces || workspaces.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No workspaces yet.</div>
        ) : (
          workspaces.map((w) => {
            const active = w.id === workspace?.id;
            return (
              <DropdownMenuItem
                key={w.id}
                onSelect={() => select(w.id)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{w.name}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/team")}>
          <Plus className="mr-2 h-4 w-4" />
          New workspace
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/team")}>
          <Users className="mr-2 h-4 w-4" />
          Manage team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
