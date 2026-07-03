import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
    });
}
const queryClient = new QueryClient();
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(Sentry.ErrorBoundary, { fallback: _jsx("p", { children: "Something went wrong." }), children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(App, {}) }) }) }));
