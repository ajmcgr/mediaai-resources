import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Mail,
  Tag,
  Globe,
  AtSign,
  Building2,
  Briefcase,
  Hash,
  MessageSquare,
  Database,
  Inbox as InboxIcon,
  ListChecks,
  Download,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoMedia from "@/assets/brand/logo-media-blue.png";

type Tab = "journalists" | "creators";

const FILTERS: { label: string; icon: typeof Search }[] = [
  { label: "Search by Names", icon: UserIcon },
  { label: "Search by Emails", icon: Mail },
  { label: "Filter by Category", icon: Tag },
  { label: "Search by Country", icon: Globe },
  { label: "Search by xHandles", icon: AtSign },
  { label: "Search by Outlet", icon: Building2 },
  { label: "Search by Title", icon: Briefcase },
  { label: "Search by Topics", icon: Hash },
];

const COLUMNS = [
  "Name",
  "Email",
  "Category",
  "Titles",
  "Topics",
  "xHandle",
  "Outlet",
];

const Dashboard = () => {
  const [tab, setTab] = useState<Tab>("journalists");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Dashboard — Media AI</title>
      </Helmet>

      {/* App header */}
      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <NavLink to="/dashboard" className="flex items-center">
            <img src={logoMedia} alt="Media AI" className="h-6" />
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground mr-2 hidden md:block">
            28,839 results
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Database
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <InboxIcon className="h-3.5 w-3.5" />
            Inbox
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Lists
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="text-sm truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/account")}>
                Account & billing
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/pricing")}>
                Plans
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-white flex flex-col flex-shrink-0">
          <div className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => setTab("journalists")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "journalists"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <Users className="h-4 w-4" />
              Journalists
            </button>
            <button
              type="button"
              onClick={() => setTab("creators")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "creators"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <Users className="h-4 w-4" />
              Creators
            </button>
          </div>

          <div className="px-3 pt-2 pb-3 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground px-3 py-2">
              Filters
            </div>
            <div className="space-y-0.5">
              {FILTERS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Table */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="border-b border-border bg-secondary/40">
            <div className="grid grid-cols-[40px_minmax(180px,1fr)_minmax(220px,1.4fr)_140px_160px_160px_140px_160px] text-xs font-medium text-muted-foreground">
              <div className="px-3 py-3" />
              {COLUMNS.map((col) => (
                <div key={col} className="px-3 py-3">
                  {col}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-24 px-6">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">
              Database wiring coming next
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              The {tab} table will load here. Schema, search, filters, and
              pagination land in the next session — your subscription is active and
              ready.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
