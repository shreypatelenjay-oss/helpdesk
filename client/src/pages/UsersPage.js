import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
const INITIAL_FORM = { name: "", email: "", password: "", role: "AGENT" };
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
export function UsersPage() {
    const qc = useQueryClient();
    const [formVisible, setFormVisible] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const { data: users, isPending, error } = useQuery({
        queryKey: ["users"],
        queryFn: () => axios.get("/api/users").then((r) => r.data),
    });
    const createUser = useMutation({
        mutationFn: (body) => axios.post("/api/users", body).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
            setForm(INITIAL_FORM);
            setFormVisible(false);
        },
    });
    const deleteUser = useMutation({
        mutationFn: (id) => axios.delete(`/api/users/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
        onError: (e) => alert(axiosError(e, "Failed to delete user")),
    });
    const handleCreate = (e) => {
        e.preventDefault();
        createUser.mutate(form);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-4xl mx-auto p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Users" }), _jsx(Button, { onClick: () => { setFormVisible((v) => !v); createUser.reset(); }, children: formVisible ? "Cancel" : "Add user" })] }), formVisible && (_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "New user" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "Jane Doe" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "email", children: "Email *" }), _jsx(Input, { id: "email", type: "email", required: true, value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), placeholder: "jane@example.com" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "password", children: "Password *" }), _jsx(Input, { id: "password", type: "password", required: true, value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "role", children: "Role" }), _jsxs("select", { id: "role", value: form.role, onChange: (e) => setForm((f) => ({ ...f, role: e.target.value })), className: "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", children: [_jsx("option", { value: "AGENT", children: "Agent" }), _jsx("option", { value: "ADMIN", children: "Admin" })] })] })] }), createUser.isError && (_jsx("p", { className: "text-sm text-destructive", children: axiosError(createUser.error, "Failed to create user") })), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", disabled: createUser.isPending, children: createUser.isPending ? "Creating…" : "Create user" }) })] }) })] })), error && _jsx("p", { className: "text-destructive text-sm", children: axiosError(error, "Failed to load users") }), isPending ? (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3" })] }) }), _jsx("tbody", { children: Array.from({ length: 4 }).map((_, i) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-28" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-40" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-14 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-20" }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Skeleton, { className: "h-6 w-14 ml-auto" }) })] }, i))) })] }) }) })) : users && (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3" })] }) }), _jsxs("tbody", { children: [users.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-6 text-center text-gray-400", children: "No users yet." }) })), users.map((user) => (_jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: user.name ?? "—" }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: user.email }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === "ADMIN"
                                                                ? "bg-violet-100 text-violet-700"
                                                                : "bg-gray-100 text-gray-600"}`, children: user.role === "ADMIN" ? "Admin" : "Agent" }) }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: new Date(user.createdAt).toLocaleDateString() }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Button, { variant: "destructive", size: "xs", disabled: deleteUser.isPending && deleteUser.variables === user.id, onClick: () => deleteUser.mutate(user.id), children: deleteUser.isPending && deleteUser.variables === user.id ? "Deleting…" : "Delete" }) })] }, user.id)))] })] }) }) }))] })] }));
}
