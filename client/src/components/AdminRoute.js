import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
export function AdminRoute({ children }) {
    const { data: session, isPending } = authClient.useSession();
    if (isPending)
        return _jsx("div", { className: "min-h-screen flex items-center justify-center text-gray-500", children: "Loading\u2026" });
    if (!session)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (session.user.role !== "ADMIN")
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(_Fragment, { children: children });
}
