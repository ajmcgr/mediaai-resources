// Defers loading of non-critical third-party scripts (Crisp chat, Senja widget)
// until the browser is idle OR the user interacts with the page.
// This keeps them out of the initial render path without removing functionality.

type Loader = () => void;

const loaders: Loader[] = [];
let triggered = false;

const runAll = () => {
  if (triggered) return;
  triggered = true;
  for (const fn of loaders) {
    try { fn(); } catch { /* swallow */ }
  }
};

const injectScript = (src: string, attrs: Record<string, string> = {}) => {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
};

const loadCrisp = () => {
  const w = window as unknown as { $crisp?: unknown[]; CRISP_WEBSITE_ID?: string };
  if (w.$crisp) return;
  w.$crisp = [];
  w.CRISP_WEBSITE_ID = "de786115-5173-4e36-a885-3927165d0636";
  injectScript("https://client.crisp.chat/l.js");
};

const loadSenja = () => {
  injectScript("https://widget.senja.io/widget/20a2f52c-c242-49a6-a8e6-38e737f40524/platform.js");
};

loaders.push(loadCrisp, loadSenja);

export const initDeferredScripts = () => {
  if (typeof window === "undefined") return;

  const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
  const onInteract = () => {
    events.forEach((ev) => window.removeEventListener(ev, onInteract));
    runAll();
  };
  events.forEach((ev) => window.addEventListener(ev, onInteract, { passive: true, once: true }));

  const ric = (window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;

  if (ric) {
    ric(runAll, { timeout: 4000 });
  } else {
    window.setTimeout(runAll, 3500);
  }
};
