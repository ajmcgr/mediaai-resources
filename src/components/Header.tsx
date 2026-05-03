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
import logoMedia from "@/assets/brand/logo-media-blue.png";

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
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a
            href="https://trymedia.ai/"
            className="flex items-center"
          >
            <img src={logoMedia} alt="Media AI" className="h-5" />
          </a>

          <div className="flex items-center space-x-2">
            {loading ? null : user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto"
                >
                  <Link to="/dashboard">Dashboard</Link>
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
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto"
                >
                  <Link to="/pricing">Pricing</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto"
                >
                  <Link to="/request-demo">Request Demo</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg px-6 h-12 text-sm"
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
