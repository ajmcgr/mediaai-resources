import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Lang = { code: string; label: string; flag: string };

const LANGS: Lang[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

function setGoogTransCookie(lang: string) {
  const value = lang === "en" ? "/en/en" : `/en/${lang}`;
  const host = window.location.hostname;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `googtrans=${value};expires=${expires};path=/`;
  // Also set on parent domain
  const parts = host.split(".");
  if (parts.length > 1) {
    const domain = "." + parts.slice(-2).join(".");
    document.cookie = `googtrans=${value};expires=${expires};path=/;domain=${domain}`;
  }
}

function readGoogTransCookie(): string {
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m ? m[1] : "en";
}

const LanguageSwitcher = () => {
  const [current, setCurrent] = useState<string>("en");

  useEffect(() => {
    setCurrent(readGoogTransCookie());

    if (document.getElementById("google-translate-script")) return;

    const container = document.createElement("div");
    container.id = "google_translate_element";
    container.style.display = "none";
    document.body.appendChild(container);

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
            includedLanguages: LANGS.map((l) => l.code).join(","),
          },
          "google_translate_element"
        );
      }
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handleSelect = (code: string) => {
    setCurrent(code);
    setGoogTransCookie(code);
    window.location.reload();
  };

  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="notranslate flex items-center gap-1 px-2 py-2 h-auto text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
            aria-label="Select language"
          >
            <span className="text-base leading-none">{active.flag}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="notranslate max-h-80 overflow-y-auto w-56">
          {LANGS.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => handleSelect(l.code)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="w-4 flex justify-center">
                {l.code === current && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-base leading-none">{l.flag}</span>
              <span className="font-medium">{l.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <style>{`
        .goog-te-banner-frame, .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .goog-tooltip, .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
      `}</style>
    </>
  );
};

export default LanguageSwitcher;
