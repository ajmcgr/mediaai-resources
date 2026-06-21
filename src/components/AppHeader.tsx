import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InboxSheet } from "@/components/dashboard/InboxSheet";
import { ListsSheet } from "@/components/dashboard/ListsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { isGrowthPlanIdentifier } from "@/lib/plans";
import logoMedia from "@/assets/brand/logo-media-blue.png";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppHeaderProps = {
  active?: "chat" | "database" | "monitor";
  rightExtras?: ReactNode;
};

const pillBase = "font-medium text-sm px-3 py-2 h-auto rounded-full";
const pillActive = "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground";
const pillInactive = "text-gray-700 hover:text-gray-900 hover:bg-gray-100";

function PillNavButton({
  to,
  active,
  children,
}: {
  to: string;
  active?: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(pillBase, active ? pillActive : pillInactive)}
      onClick={() => !active && navigate(to)}
    >
      {children}
    </Button>
  );
}


export default function AppHeader({ active, rightExtras }: AppHeaderProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { planIdentifier, active: subActive, loading: subLoading } = useSubscription();
  const hasGrowth = isGrowthPlanIdentifier(planIdentifier);
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[AppHeader] plan", { planIdentifier, subActive, subLoading, hasGrowth });
  }
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[AppHeader] plan", { planIdentifier, active, hasGrowth });
  }
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-10">
        <NavLink to={hasGrowth ? "/database" : "/chat"} className="flex items-center">
          <img src={logoMedia} alt="Media AI" className="h-5" />
        </NavLink>
        <div className="flex items-center gap-1 sm:gap-2">
          <PillNavButton to="/chat" active={active === "chat"}>Chat</PillNavButton>
          {hasGrowth && (
            <PillNavButton to="/database" active={active === "database"}>Database</PillNavButton>
          )}
          <PillNavButton to="/monitor" active={active === "monitor"}>Monitor</PillNavButton>
          <InboxSheet />
          <ListsSheet />
          {rightExtras}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="font-medium text-sm px-3 py-2 h-auto text-gray-700 hover:text-gray-900 hover:bg-transparent"
        >
          <a href="mailto:alex@trymedia.ai">Support</a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" aria-label="Account menu">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-xs text-muted-foreground">Signed in as</div>
              <div className="text-sm truncate">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/account")}>Account & billing</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/team")}>Team</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/pricing")}>Plans</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
