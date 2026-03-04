import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./lib/sw-register";

// Register Service Worker for PWA
registerSW();

createRoot(document.getElementById("root")!).render(<App />);

