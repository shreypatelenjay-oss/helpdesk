import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navbar } from "./Navbar";
import { Skeleton } from "./ui/skeleton";
export function TicketDetailSkeleton() {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", "data-testid": "detail-loading", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Skeleton, { className: "h-9 w-24" }), _jsx(Skeleton, { className: "h-6 w-16" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "md:col-span-2 space-y-4", children: [_jsx(Skeleton, { className: "h-10 w-3/4" }), _jsx(Skeleton, { className: "h-64 w-full" })] }), _jsx("div", { className: "space-y-4", children: _jsx(Skeleton, { className: "h-48 w-full" }) })] })] })] }));
}
