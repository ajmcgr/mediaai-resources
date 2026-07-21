import { NavLink, useNavigate } from "react-router-dom";
import {
  Database, Download, HelpCircle, Inbox, ListChecks, PanelLeftClose, PanelLeftOpen,
  Search, Settings, Sparkles, Target,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { InboxSheet } from "@/components/dashboard/InboxSheet";
import { ListsSheet } from "@/components/dashboard/ListsSheet";
import { isGrowthPlanIdentifier } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";
import logoMedia from "@/assets/brand/logo-media-blue.png";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  active?: "search" | "database" | "monitor" | "settings";
};

type ItemProps = {
  to?: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const expandedItem = "flex h-[58px] w-full items-center gap-4 rounded-2xl px-7 text-[17px] font-semibold transition-colors";
const collapsedItem = "mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-colors";

function SidebarItem({ to, label, icon, active, disabled, onClick }: ItemProps) {
  const classes = cn(
    expandedItem,
    active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100",
    disabled && "cursor-not-allowed text-slate-300 hover:bg-transparent",
  );

  if (to && !disabled) {
    return (
      <NavLink to={to} className={classes}>
        {icon}<span>{label}</span>
      </NavLink>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      {icon}<span>{label}</span>
    </button>
  );
}

function CollapsedItem({ to, label, icon, active, disabled, onClick }: ItemProps) {
  const classes = cn(
    collapsedItem,
    active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100",
    disabled && "cursor-not-allowed text-slate-300 hover:bg-transparent",
  );

  if (to && !disabled) {
    return <NavLink to={to} className={classes} title={label} aria-label={label}>{icon}</NavLink>;
  }
  return <button type="button" className={classes} onClick={onClick} disabled={disabled} title={label} aria-label={label}>{icon}</button>;
}

export default function AppSidebar({ active }: AppSidebarProps) {
  const navigate = useNavigate();
  const { planIdentifier } = useSubscription();
  const hasGrowth = isGrowthPlanIdentifier(planIdentifier);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("app.sidebarCollapsed") === "1");

  useEffect(() => {
    localStorage.setItem("app.sidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const itemIcon = "h-6 w-6 shrink-0";
  const navItems: ItemProps[] = [
    { to: "/search", label: "Search", icon: <Search className={itemIcon} />, active: active === "search" },
    { to: hasGrowth ? "/database" : undefined, label: "Database", icon: <Database className={itemIcon} />, active: active === "database", disabled: !hasGrowth },
    { to: "/monitor", label: "Monitor", icon: <Target className={itemIcon} />, active: active === "monitor" },
  ];

  if (collapsed) {
    return (
      <aside className="hidden h-screen w-[72px] shrink-0 border-r border-border bg-white md:flex md:flex-col">
        <div className="flex h-20 items-center justify-center">
          <button type="button" onClick={() => navigate(hasGrowth ? "/database" : "/search")} aria-label="Media AI home">
            <img src={logoMedia} alt="Media AI" className="h-5 w-5 object-cover object-left" />
          </button>
        </div>
        <div className="px-2">
          <button type="button" onClick={() => setCollapsed(false)} className={collapsedItem} title="Expand" aria-label="Expand">
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-4 space-y-2 px-2">
          {navItems.map((item) => <CollapsedItem key={item.label} {...item} />)}
          <InboxSheet triggerClassName={collapsedItem} triggerChildren={<Inbox className={itemIcon} />} />
          <ListsSheet triggerClassName={collapsedItem} triggerChildren={<ListChecks className={itemIcon} />} />
          <CollapsedItem label="Export" icon={<Download className={itemIcon} />} disabled />
        </nav>
        <nav className="mt-auto space-y-2 px-2 pb-6">
          <CollapsedItem to="/account#credits" label="Buy credits" icon={<Sparkles className={itemIcon} />} />
          <CollapsedItem to="/account" label="Settings" icon={<Settings className={itemIcon} />} active={active === "settings"} />
          <CollapsedItem label="Help" icon={<HelpCircle className={itemIcon} />} onClick={() => { window.location.href = "mailto:alex@trymedia.ai"; }} />
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden h-screen w-[420px] shrink-0 border-r border-border bg-white md:flex md:flex-col">
      <div className="flex h-[114px] items-center border-b border-border px-8">
        <button type="button" onClick={() => navigate(hasGrowth ? "/database" : "/search")} aria-label="Media AI home">
          <img src={logoMedia} alt="Media AI" className="h-10" />
        </button>
      </div>
      <div className="flex-1 px-4 py-8">
        <button type="button" onClick={() => setCollapsed(true)} className="mb-8 flex items-center gap-5 px-5 text-[17px] font-semibold text-slate-700 hover:text-slate-950">
          <PanelLeftClose className="h-7 w-7" />
          Collapse
        </button>
        <nav className="space-y-2">
          {navItems.map((item) => <SidebarItem key={item.label} {...item} />)}
          <InboxSheet triggerClassName={expandedItem + " text-slate-700 hover:bg-slate-100"} triggerChildren={<><Inbox className={itemIcon} /><span>Inbox</span></>} />
          <ListsSheet triggerClassName={expandedItem + " text-slate-700 hover:bg-slate-100"} triggerChildren={<><ListChecks className={itemIcon} /><span>Lists</span></>} />
          <SidebarItem label="Export" icon={<Download className={itemIcon} />} disabled />
        </nav>
      </div>
      <nav className="space-y-2 px-4 pb-10">
        <SidebarItem to="/account#credits" label="Buy credits" icon={<Sparkles className={itemIcon} />} />
        <SidebarItem to="/account" label="Settings" icon={<Settings className={itemIcon} />} active={active === "settings"} />
        <SidebarItem label="Help" icon={<HelpCircle className={itemIcon} />} onClick={() => { window.location.href = "mailto:alex@trymedia.ai"; }} />
      </nav>
    </aside>
  );
}
