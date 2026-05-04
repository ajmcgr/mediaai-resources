import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
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
import logoMedia from "@/assets/brand/logo-media-color-official.png";

const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-transparent">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
        <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
          <a
            href="https://trymedia.ai/"
            className="flex shrink-0 items-center"
            aria-label="Media AI home"
          >
            <img
              src={logoMedia}
              alt="Media AI"
              width={960}
              height={222}
              className="block h-6 w-auto max-w-[104px] object-contain sm:h-7 sm:max-w-[120px]"
            />
          </a>

          <div className="flex min-w-0 items-center justify-end space-x-1 sm:space-x-2">
            {loading ? null : user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:inline-flex text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-3 py-2 h-auto"
                >
                  <Link to="/chat">Chat</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-3 py-2 h-auto"
                >
                  <Link to="/dashboard">Database</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-3 py-2 h-auto"
                >
                  <Link to="/monitor">Monitor</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label="Account menu"
                    >
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="text-xs text-muted-foreground">Signed in as</div>
                      <div className="text-sm truncate">{user.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
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
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-2 py-2 h-auto sm:px-4"
                >
                  <Link to="/pricing">Pricing</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden lg:inline-flex text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto"
                >
                  <Link to="/request-demo">Request Demo</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-2 py-2 h-auto sm:px-4"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg px-4 h-12 text-sm sm:px-6"
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
