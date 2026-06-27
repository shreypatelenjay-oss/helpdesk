import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "react-router-dom";
import { Role } from "@repo/core";
import { authClient } from "../lib/auth-client";
export function Navbar() {
    const { data: session } = authClient.useSession();
    const navigate = useNavigate();
    const handleSignOut = async () => {
        await authClient.signOut();
        navigate("/login", { replace: true });
    };
    return (_jsxs("nav", { className: "flex items-center justify-between px-6 py-4 border-b bg-white", children: [_jsx(Link, { to: "/", className: "font-semibold text-gray-900", children: "Ticket Management" }), _jsxs("div", { className: "flex items-center gap-4", children: [session?.user?.role === Role.ADMIN && (_jsx(Link, { to: "/users", className: "text-sm text-gray-700 hover:text-gray-900 transition-colors", children: "Users" })), _jsx("span", { className: "text-sm text-gray-700", children: session?.user?.name ?? session?.user?.email }), _jsx("button", { onClick: handleSignOut, className: "px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 transition-colors", children: "Sign out" })] })] }));
}
