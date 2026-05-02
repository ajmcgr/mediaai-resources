import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Check, Plus, Minus, ArrowRight, Star, Rocket, Briefcase, Home as HomeIcon, Building2, User as UserIcon, Bot, X as XIcon } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/billing";
import { toast } from "sonner";

type Interval = "monthly" | "yearly";
type PlanId = "journalist" | "creator" | "both";

const TIERS: { id: PlanId; name: string; monthly: number; yearly: number; highlight?: boolean }[] = [
  { id: "journalist", name: "Journalist Database", monthly: 99, yearly: 999 },
  { id: "creator", name: "Creators Database", monthly: 99, yearly: 999 },
  { id: "both", name: "Full Database", monthly: 149, yearly: 1499, highlight: true },
];

const PLAN_FEATURES = [
  { title: "100% database access", body: "Get full access to the data — no limits." },
  { title: "Sort, group, filter, share/sync", body: "Manipulate data with ease using our various filtering and sorting options." },
  { title: "Share", body: "Quickly share media contacts with your colleagues via link, embed or email." },
  { title: "No contracts", body: "We never tie you down with contracts. Each subscription is a one-time purchase. Cancel any-time." },
  { title: "Delivery", body: "Immediate access upon payment." },
];

const FAQS = [
  { q: "What is Media AI?", a: "Media AI is a database of journalists and creators powered by AI. We help PR and social media professionals find the right contacts to pitch their stories and campaigns." },
  { q: "How many Journalists and Creators do you have in your database?", a: "We have tens of thousands of journalists and creators in our database, and we are constantly adding more. Our AI crawls the web to keep contact info fresh and accurate." },
  { q: "Do you offer Journalist email addresses?", a: "Yes — every journalist and creator profile includes a verified email address along with relevant social handles and beat information." },
  { q: "Do you offer full access to the contacts?", a: "Yes. Every paid plan includes 100% access to the database — no row limits, no paywalled rows, no hidden gates." },
  { q: "How accurate is your journalist contact data?", a: "Our AI continuously verifies contact information against public sources. We re-check records frequently and remove outdated entries as soon as we detect changes." },
  { q: "Can I pause/downgrade my plan?", a: "You can cancel or change your plan at any time from your account page. There are no contracts and no cancellation fees." },
  { q: "Where do you find journalist and creators contacts?", a: "Our proprietary AI crawler aggregates publicly available information from outlets, social platforms, bylines, and creator profiles across the web." },
  { q: "Can I review the databases before I purchase?", a: "Yes — every plan comes with a 1-month free trial so you can explore the full database before being charged." },
];

const AUDIENCES = [
  { icon: Rocket, label: "Startups", body: "Find the right journalists fast and get more media coverage, effortlessly." },
  { icon: Briefcase, label: "SMB's", body: "Scale outreach without scaling headcount — pitch smarter with verified contacts." },
  { icon: HomeIcon, label: "In-house", body: "Centralize your media list and keep your team aligned on every campaign." },
  { icon: Building2, label: "PR/Social Media Agencies", body: "Manage multiple clients with one source of truth for journalist and creator contacts." },
  { icon: UserIcon, label: "Freelancers", body: "Punch above your weight with the same database the big agencies use." },
];

const VALUE_PROPS = [
  { title: "AI Crawler", body: "Our AI crawls the web to find the contact info of the world's leading journalists and creators." },
  { title: "Proprietary data", body: "Our proprietary database is updated with all key information you need including email and socials." },
  { title: "Sync and share", body: "Export and download all the contacts you need in whatever format you need including Excel, PDF & more." },
  { title: "No contracts", body: "We don't tie you down to a contract or require a sales pitch." },
  { title: "Always updated", body: "Our AI is constantly double checking journalist and creator contact info while always adding new contacts." },
  { title: "Media experts", body: "Our team is comprised of real PR and Social media experts — not financial or sales types." },
];

const TESTIMONIALS = [
  { quote: "Media AI made it so easy to find the right collaborators for our campaign. It's a game-changer.", name: "Sarah Jones", role: "Marketing Manager, Remote3" },
  { quote: "I used Media AI to get the best find journalists and influencers for our event. Their team are so helpful.", name: "Medet Serik", role: "Executive Solutions Consultant, Huawei" },
  { quote: "I work across several markets in APAC. Media AI helped me find journalists across every one of them.", name: "Jackson Nemeth", role: "Business Development, Cibes Lift Group" },
];

const FEATURE_BLOCKS = [
  {
    eyebrow: "Discover",
    title: "Effortlessly explore creators and journalists",
    body: "Effortlessly explore a rich database of creators and journalists, handpicked for their expertise and credibility. Whether you're seeking creative talent for a campaign or a journalist to amplify your story.",
    bullets: [
      "Access to a growing network of professionals",
      "Streamlined interface for intuitive browsing",
      "Discover fresh talent for topics or industries",
    ],
  },
  {
    eyebrow: "Search and Filter",
    title: "Pinpoint the right contacts in seconds",
    body: "Refine your search and save time with advanced filtering options. Our search tool lets you pinpoint profiles based on topics, categories, or job titles, ensuring you find exactly what you're looking for.",
    bullets: [
      "Filter by beat, outlet, country, or title",
      "Save views and reuse your favorite filters",
      "Search by name, email, or social handle",
    ],
  },
  {
    eyebrow: "Seamless Export",
    title: "Take your list anywhere",
    body: "Whether you need a shortlist of potential candidates or a comprehensive database, our export feature helps you stay organized and productive.",
    bullets: [
      "Export to CSV, Excel, or PDF",
      "Share contacts with your team via link or email",
      "One-click sync to keep lists fresh",
    ],
  },
];

const Index = () => {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  const handleSubscribe = async (plan: PlanId) => {
    if (!user) {
      navigate(`/signup?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`);
      return;
    }
    try {
      setPendingPlan(plan);
      await startCheckout(plan);
    } catch (e) {
      toast.error((e as Error).message ?? "Could not start checkout");
      setPendingPlan(null);
    }
  };

  const ctaTrial = (
    <Button
      onClick={() => (user ? navigate("/pricing") : navigate("/signup"))}
      className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg px-6 h-12 text-sm"
    >
      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Find Any Journalist or Creator Email. Instantly. — Media AI</title>
        <meta
          name="description"
          content="Find the right journalists and creators for your stories, campaigns, and projects in seconds. AI-powered media database with verified emails and socials."
        />
        <link rel="canonical" href="https://resources.trymedia.ai/" />
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Find Any <span className="text-primary">Journalist or Creator Email.</span> Instantly.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Find the right voices for your stories, campaigns, and projects in just a few clicks from our database of top journalists and creators — powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            {ctaTrial}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["bg-orange-300", "bg-blue-300", "bg-emerald-300"].map((c, i) => (
                  <div key={i} className={`h-9 w-9 rounded-full border-2 border-background ${c}`} />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">PR & Social Media pros love us</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1-month free trial</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Secure payment</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel any-time</span>
          </div>
        </div>

        {/* Product mock placeholder */}
        <div className="max-w-5xl mx-auto mt-16 rounded-2xl border border-border bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="p-6 grid grid-cols-12 gap-4 min-h-[320px]">
            <div className="col-span-3 space-y-2">
              {["Search by Names", "Search by Emails", "Filter by Category", "Search by Country", "Search by xHandles", "Search by Outlet", "Search by Title", "Search by Topics"].map((s) => (
                <div key={s} className="text-xs px-3 py-2 rounded-md bg-secondary text-muted-foreground">{s}</div>
              ))}
            </div>
            <div className="col-span-9">
              <div className="text-xs text-muted-foreground mb-2">30,503 results</div>
              <div className="grid grid-cols-4 text-[11px] font-medium text-muted-foreground border-b border-border pb-2 mb-2">
                <span>Name</span><span>Email</span><span>Category</span><span>Title</span>
              </div>
              {[
                ["Todd Spangler", "todd.spangler@variety.com", "Business", "New York Digital Editor"],
                ["Dana Priest", "dana.priest@washpost.com", "Business", "Investigative Reporter"],
                ["Alex Young", "—", "Business", "Publisher & Founder"],
                ["Laurent Le Pape", "l.lepape@infosbar.com", "Business", "Rédacteur en Chef"],
                ["Owen Geronimo", "—", "Business", "Founder"],
                ["Carolina Afonso", "carolinaafonso@iseg.ulisboa.pt", "Business", "Diretor Editorial"],
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 text-xs py-2 border-b border-border/60">
                  <span>{row[0]}</span>
                  <span className="text-muted-foreground truncate pr-2">{row[1]}</span>
                  <span><span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px]">{row[2]}</span></span>
                  <span className="text-muted-foreground truncate">{row[3]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-secondary/40">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Powerful Features Built to <br className="hidden md:block" /> Simplify Discovery
          </h2>
        </div>

        <div className="max-w-5xl mx-auto space-y-12">
          {FEATURE_BLOCKS.map((f, i) => (
            <div
              key={f.eyebrow}
              className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <span className="inline-block text-xs font-medium tracking-wide uppercase text-primary mb-3">
                  {f.eyebrow}
                </span>
                <h3 className="text-2xl md:text-3xl font-medium mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {f.title}
                </h3>
                <p className="text-muted-foreground mb-6">{f.body}</p>
                <ul className="space-y-3 mb-6">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {ctaTrial}
              </div>
              <div className="rounded-xl border border-border bg-white p-6 min-h-[240px] shadow-[var(--shadow-card)] flex items-center justify-center text-muted-foreground text-sm">
                Product preview
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logo strip */}
      <section className="px-6 py-16 border-y border-border">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-8">
            Innovative brands that have secured media coverage with us
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {["Acme", "Northstar", "Lumen", "Vertex", "Orbit", "Forge", "Helix"].map((n) => (
              <span key={n} className="text-lg font-medium tracking-tight text-muted-foreground">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              For any PR or Social Media pro
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              People who use Media AI include PR and Social Media professionals everywhere.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {AUDIENCES.map((a) => (
              <div key={a.label} className="rounded-xl border border-border bg-white p-6">
                <a.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-medium mb-2">{a.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial 1 */}
      <Testimonial t={TESTIMONIALS[0]} />

      {/* Value props */}
      <section className="px-6 py-20 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              The media database built by PR's, for PR's
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              People who use Media AI include PR and Social Media professionals everywhere.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-white p-6">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial 2 */}
      <Testimonial t={TESTIMONIALS[1]} />

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Flexible pricing plans to suit your needs
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose between monthly and yearly subscriptions.
            </p>
            <div className="inline-flex items-center mt-8 p-1 rounded-full border border-border bg-secondary">
              {(["monthly", "yearly"] as Interval[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setInterval(opt)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    interval === opt
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt === "monthly" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const price = interval === "monthly" ? tier.monthly : tier.yearly;
              const period = interval === "monthly" ? "/mo" : "/yr";
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl p-8 flex flex-col ${
                    tier.highlight
                      ? "bg-foreground text-background border border-foreground"
                      : "bg-white border border-border"
                  }`}
                >
                  <h3 className="text-xl font-medium mb-1">{tier.name}</h3>
                  <div className="my-6">
                    <span className="text-4xl font-medium">${price}</span>
                    <span className={`text-sm ml-1 ${tier.highlight ? "text-background/70" : "text-muted-foreground"}`}>{period}</span>
                  </div>
                  <Button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={pendingPlan !== null}
                    className={`w-full mb-6 ${tier.highlight ? "bg-white text-foreground hover:bg-white/90" : ""}`}
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    {pendingPlan === tier.id ? "Redirecting…" : "Start Free Trial"}
                  </Button>
                  <ul className="space-y-3 text-sm">
                    {PLAN_FEATURES.map((f) => (
                      <li key={f.title} className="flex items-start gap-2">
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${tier.highlight ? "text-background/80" : "text-primary"}`} />
                        <div>
                          <span className="font-medium">{f.title}: </span>
                          <span className={tier.highlight ? "text-background/80" : "text-muted-foreground"}>{f.body}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-16 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-10" style={{ fontFamily: "var(--font-heading)" }}>
            COMPARED*
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium"></th>
                  <th className="p-4 font-medium text-primary">Media AI</th>
                  <th className="p-4 font-medium text-muted-foreground">Muck Rack**</th>
                  <th className="p-4 font-medium text-muted-foreground">Cision**</th>
                  <th className="p-4 font-medium text-muted-foreground">Meltwater**</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-b [&>tr]:border-border [&>tr:last-child]:border-0">
                {[
                  { label: "Journalist database", row: [true, true, true, true] },
                  { label: "Creator database", row: [true, false, false, false] },
                  { label: "Export to CSV", row: [true, true, true, true] },
                  { label: "Updated", row: ["AI", "?", "?", "?"] },
                  { label: "Monthly cost***", row: ["$99", "$400+", "$700+", "$1000+"] },
                  { label: "Annual cost****", row: ["$999", "$5,000+", "$8,000+", "$12,000+"] },
                  { label: "Payment", row: ["Card", "Contract", "Contract", "Contract"] },
                  { label: "Free Trial?", row: [true, false, false, false] },
                ].map((r) => (
                  <tr key={r.label}>
                    <td className="p-4 font-medium">{r.label}</td>
                    {r.row.map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {typeof v === "boolean" ? (
                          v ? <Check className="h-5 w-5 text-primary mx-auto" /> : <XIcon className="h-5 w-5 text-destructive mx-auto" />
                        ) : (
                          <span className={i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}>{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            *Trademarks owned by Muck Rack, LLC, Cision US Inc., Meltwater News US Inc / **Estimated, companies do not publicly provide database size / *** ****Estimated, companies do not publicly provide pricing on their websites
          </p>
          <div className="text-center mt-8">{ctaTrial}</div>
        </div>
      </section>

      {/* Testimonial 3 */}
      <Testimonial t={TESTIMONIALS[2]} />

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-center mb-12" style={{ fontFamily: "var(--font-heading)" }}>
            FAQ's
          </h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="rounded-xl border border-border bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium pr-4">{f.q}</span>
                    {open ? <Minus className="h-5 w-5 text-primary flex-shrink-0" /> : <Plus className="h-5 w-5 text-primary flex-shrink-0" />}
                  </button>
                  {open && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-secondary/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-8" style={{ fontFamily: "var(--font-heading)" }}>
            Find journalists and creators. <br />Start exploring Media AI today.
          </h2>
          {ctaTrial}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="https://trymedia.ai/about" className="hover:text-foreground">About</a></li>
              <li><a href="https://blog.trymedia.ai/" className="hover:text-foreground">Blog</a></li>
              <li><a href="https://discord.gg/zrFtSbzQ2W" className="hover:text-foreground">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="mailto:support@trymedia.ai" className="hover:text-foreground">Support</a></li>
              <li><a href="https://trymedia.ai/privacy-policy" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="https://trymedia.ai/terms-of-service" className="hover:text-foreground">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Resources</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/resources" className="hover:text-foreground">All Resources →</Link></li>
              <li><a href="https://trybio.ai/" className="hover:text-foreground">Link-in-bio Creator ↗</a></li>
              <li><a href="https://www.promptmonitor.io/" className="hover:text-foreground">AI Visibility ↗</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Free Tools</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="https://tools.trymedia.ai/" className="hover:text-foreground">View All Tools →</a></li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-10">© {new Date().getFullYear()} Media AI</p>
      </footer>
    </div>
  );
};

const Testimonial = ({ t }: { t: { quote: string; name: string; role: string } }) => (
  <section className="px-6 py-16">
    <div className="max-w-3xl mx-auto text-center">
      <div className="flex items-center justify-center gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-xl md:text-2xl font-medium leading-relaxed mb-6" style={{ fontFamily: "var(--font-heading)" }}>
        “{t.quote}”
      </p>
      <div className="flex items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-full bg-secondary" />
        <div className="text-left">
          <div className="text-sm font-medium">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.role}</div>
        </div>
      </div>
    </div>
  </section>
);

export default Index;
