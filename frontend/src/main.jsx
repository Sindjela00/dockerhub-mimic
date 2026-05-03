import "./index.css";

import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.js";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ToastMessages/ToastProvider";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ToastProvider>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </ToastProvider>,
  // </StrictMode>,
);
