import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import { App } from "./app/App";
import { FoundationProvider } from "./features/foundation-input/FoundationContext";
import { AuthProvider } from "./features/auth/AuthContext";
import "./styles.css";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><FoundationProvider><App /></FoundationProvider></AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
