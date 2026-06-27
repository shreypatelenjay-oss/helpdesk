import { jsx as _jsx } from "react/jsx-runtime";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
export function renderWithQuery(ui) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(MemoryRouter, { children: ui }) }));
}
