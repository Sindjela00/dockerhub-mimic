import "./index.css";

import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.js";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>,
  // </StrictMode>,
);
