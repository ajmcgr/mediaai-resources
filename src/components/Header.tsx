import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a
            href="https://trymedia.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <img
              src="/lovable-uploads/e30b4157-d7ea-4910-acef-04e28b2e90f8.png"
              alt="Media AI"
              className="h-6"
            />
          </a>

          <div className="flex items-center space-x-2">
            {loading ? null : user ? (
              <>
                <Button asChild variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto">
                  <Link to="/app">Dashboard</Link>
                </Button>
                <Button
                  onClick={handleSignOut}
                  className="font-medium text-sm h-auto border border-solid"
                  style={{
                    backgroundColor: "#ffffff", color: "#22252a", borderColor: "#e3e4e5",
                    borderRadius: "8px", padding: "10px 20px", minHeight: "48px",
                    fontWeight: 500, fontSize: "14px",
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-transparent font-medium text-sm px-4 py-2 h-auto">
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="font-medium text-sm h-auto border border-solid"
                  style={{
                    backgroundColor: "#ffffff", color: "#22252a", borderColor: "#e3e4e5",
                    borderRadius: "8px", padding: "10px 20px", minHeight: "48px",
                    fontWeight: 500, fontSize: "14px",
                  }}
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
