import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/product-banners.css";
import { setupGlobalErrorHandlers } from "./lib/error-logger";
import "./i18n/config"; // Initialiser i18n

// Setup global error handlers
setupGlobalErrorHandlers();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail - PWA is optional
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
