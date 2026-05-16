import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initDeferredScripts } from './lib/deferredScripts'

createRoot(document.getElementById("root")!).render(<App />);

// Load non-critical third-party scripts (Crisp, Senja) on idle/interaction
initDeferredScripts();
