import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Download, Package } from "lucide-react";

type Asset = {
  title: string;
  description: string;
  preview: string;
  bg?: string;
  files: { label: string; href: string }[];
};

const LOGOS: Asset[] = [
  {
    title: "Color logo — no background",
    description: "Primary logo. Use on white or light backgrounds.",
    preview: "/media-kit/png/Color logo - no background.png",
    bg: "bg-[#fafafa]",
    files: [
      { label: "SVG", href: "/media-kit/svg/Color logo - no background.svg" },
      { label: "PNG", href: "/media-kit/png/Color logo - no background.png" },
    ],
  },
  {
    title: "Color logo with background",
    description: "Logo locked to its branded background — for social posts and avatars.",
    preview: "/media-kit/png/Color logo with background.png",
    bg: "bg-[#fafafa]",
    files: [
      { label: "SVG", href: "/media-kit/svg/Color logo with background.svg" },
      { label: "PNG", href: "/media-kit/png/Color logo with background.png" },
    ],
  },
  {
    title: "Black logo — no background",
    description: "Monochrome variant. Use where color isn't appropriate.",
    preview: "/media-kit/png/Black logo - no background.png",
    bg: "bg-[#fafafa]",
    files: [
      { label: "SVG", href: "/media-kit/svg/Black logo - no background.svg" },
      { label: "PNG", href: "/media-kit/png/Black logo - no background.png" },
    ],
  },
  {
    title: "White logo — no background",
    description: "For dark backgrounds and high-contrast placements.",
    preview: "/media-kit/png/White logo - no background.png",
    bg: "bg-neutral-900",
    files: [
      { label: "SVG", href: "/media-kit/svg/White logo - no background.svg" },
      { label: "PNG", href: "/media-kit/png/White logo - no background.png" },
    ],
  },
];

const SOCIALS: Asset[] = [
  {
    title: "LinkedIn — Page banner",
    description: "1584×396 cover image for the company LinkedIn page.",
    preview: "/media-kit/socials/li-page-banner.png",
    bg: "bg-[#fafafa]",
    files: [{ label: "PNG", href: "/media-kit/socials/li-page-banner.png" }],
  },
  {
    title: "LinkedIn — Personal banner",
    description: "1584×396 cover image for personal LinkedIn profiles.",
    preview: "/media-kit/socials/li-personal-banner.png",
    bg: "bg-[#fafafa]",
    files: [{ label: "PNG", href: "/media-kit/socials/li-personal-banner.png" }],
  },
  {
    title: "X (Twitter) — Header",
    description: "1500×500 header image for X profiles.",
    preview: "/media-kit/socials/x-banner.png",
    bg: "bg-[#fafafa]",
    files: [{ label: "PNG", href: "/media-kit/socials/x-banner.png" }],
  },
  {
    title: "Social avatar",
    description: "Square brand mark for profile pictures.",
    preview: "/media-kit/socials/media.png",
    bg: "bg-[#fafafa]",
    files: [
      { label: "PNG", href: "/media-kit/socials/media.png" },
      { label: "PSD", href: "/media-kit/socials/media.psd" },
    ],
  },
  {
    title: "Icon — color",
    description: "Standalone icon mark, full color.",
    preview: "/media-kit/socials/media-icon.png",
    bg: "bg-[#fafafa]",
    files: [{ label: "PNG", href: "/media-kit/socials/media-icon.png" }],
  },
  {
    title: "Icon — white",
    description: "Standalone icon mark for dark backgrounds.",
    preview: "/media-kit/socials/media-icon-w.png",
    bg: "bg-neutral-900",
    files: [{ label: "PNG", href: "/media-kit/socials/media-icon-w.png" }],
  },
];

const FAVICONS: Asset[] = [
  {
    title: "Browser favicon",
    description: "Use as the site favicon.",
    preview: "/media-kit/Favicons/browser.png",
    bg: "bg-[#fafafa]",
    files: [{ label: "PNG", href: "/media-kit/Favicons/browser.png" }],
  },
  {
    title: "iPhone touch icon",
    description: "Apple touch icon for iOS home screen.",
    preview: "/media-kit/Favicons/iPhone.png",
    bg: "bg-[#fafafa]",
    files: [
      { label: "SVG", href: "/media-kit/Favicons/iPhone.svg" },
      { label: "PNG", href: "/media-kit/Favicons/iPhone.png" },
    ],
  },
  {
    title: "Android icon",
    description: "Android home screen icon.",
    preview: "/media-kit/Favicons/Android.png",
    bg: "bg-[#fafafa]",
    files: [{ label: "PNG", href: "/media-kit/Favicons/Android.png" }],
  },
];

const BRAND_COLORS = [
  { name: "Brand Blue", hex: "#1675E2", swatch: "bg-[#1675E2]" },
  { name: "Foreground", hex: "#101214", swatch: "bg-[#101214]" },
  { name: "Surface", hex: "#FAFBFC", swatch: "bg-[#FAFBFC] ring-1 ring-black/10" },
];

function AssetGrid({ assets }: { assets: Asset[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((a) => (
        <div key={a.title} className="rounded-xl border bg-white overflow-hidden flex flex-col">
          <div className={`aspect-[4/3] flex items-center justify-center p-6 ${a.bg ?? "bg-muted"}`}>
            <img src={a.preview} alt={a.title} className="max-h-full max-w-full object-contain" loading="lazy" />
          </div>
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div>
              <h3 className="font-medium text-foreground">{a.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {a.files.map((f) => (
                <a
                  key={f.href}
                  href={f.href}
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  {f.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const MediaKit = () => {
  return (
    <Layout>
      <Helmet>
        <title>Media Kit — Media AI</title>
        <meta
          name="description"
          content="Download Media AI logos, social banners, favicons, and brand colors. All assets ready for press, partners, and integrations."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <header className="mb-12 max-w-3xl">
          <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Media Kit</p>
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">Brand assets</h1>
          <p className="text-lg text-muted-foreground">
            Logos, icons, social banners and brand colors for press, partners and integrations.
            Please don't alter the marks — keep proportions, color, and clear space intact.
          </p>
          <a
            href="/media-kit/media-kit-full.zip"
            download
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Package className="h-4 w-4" />
            Download full media kit (.zip)
          </a>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-medium mb-6">Logos</h2>
          <AssetGrid assets={LOGOS} />
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-medium mb-2">Brand colors</h2>
          <p className="text-muted-foreground mb-6">Our core palette. Use Brand Blue sparingly as an accent.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {BRAND_COLORS.map((c) => (
              <div key={c.hex} className="rounded-xl border bg-white overflow-hidden">
                <div className={`h-28 ${c.swatch}`} />
                <div className="p-4">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/40 p-8">
          <h2 className="text-xl font-medium mb-2">Need something else?</h2>
          <p className="text-muted-foreground">
            For custom assets, partnership inquiries, or press requests, email{" "}
            <a href="mailto:press@trymedia.ai" className="text-foreground underline">press@trymedia.ai</a>.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default MediaKit;
