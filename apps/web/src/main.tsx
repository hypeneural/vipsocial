import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./lib/sw-register";

declare global {
  interface Window {
    __VIP_BUILD__?: string;
  }
}

window.__VIP_BUILD__ = __APP_BUILD_ID__;
console.info("[VIP BUILD]", __APP_BUILD_ID__);

// Register Service Worker for PWA
registerSW();

createRoot(document.getElementById("root")!).render(<App />);

