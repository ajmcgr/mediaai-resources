import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-medium mb-4">Welcome{user?.email ? `, ${user.email}` : ""}</h1>
        <p className="text-muted-foreground mb-8">
          Phase 1 (Auth) complete. Search, lists, exports, billing, chat, inbox, and admin will come next.
        </p>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </main>
    </div>
  );
};

export default Dashboard;
