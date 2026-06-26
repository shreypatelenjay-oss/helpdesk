import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, } from "../components/ui/card";
const INITIAL_FORM = { name: "", email: "", password: "", role: "AGENT" };
function useUsers() {
    const [users, setUsers] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/users");
            if (!res.ok)
                throw new Error("Failed to load users");
            setUsers(await res.json());
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    };
    return { users, loading, error, fetchUsers, setUsers };
}
export function UsersPage() {
    const { users, loading, error, fetchUsers, setUsers } = useUsers();
    const [formVisible, setFormVisible] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    // Fetch on first render
    useState(() => { fetchUsers(); });
    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error ?? "Failed to create user");
            setUsers((prev) => (prev ? [...prev, data] : [data]));
            setForm(INITIAL_FORM);
            setFormVisible(false);
        }
        catch (e) {
            setFormError(e.message);
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to delete user");
            }
            setUsers((prev) => (prev ? prev.filter((u) => u.id !== id) : prev));
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            setDeletingId(null);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-4xl mx-auto p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Users" }), _jsx(Button, { onClick: () => { setFormVisible((v) => !v); setFormError(null); }, children: formVisible ? "Cancel" : "Add user" })] }), formVisible && (_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "New user" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleCreate, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "Jane Doe" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "email", children: "Email *" }), _jsx(Input, { id: "email", type: "email", required: true, value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), placeholder: "jane@example.com" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "password", children: "Password *" }), _jsx(Input, { id: "password", type: "password", required: true, value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "role", children: "Role" }), _jsxs("select", { id: "role", value: form.role, onChange: (e) => setForm((f) => ({ ...f, role: e.target.value })), className: "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", children: [_jsx("option", { value: "AGENT", children: "Agent" }), _jsx("option", { value: "ADMIN", children: "Admin" })] })] })] }), formError && _jsx("p", { className: "text-sm text-destructive", children: formError }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", disabled: submitting, children: submitting ? "Creating…" : "Create user" }) })] }) })] })), loading && _jsx("p", { className: "text-gray-500 text-sm", children: "Loading\u2026" }), error && _jsx("p", { className: "text-destructive text-sm", children: error }), users && (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3" })] }) }), _jsxs("tbody", { children: [users.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-6 text-center text-gray-400", children: "No users yet." }) })), users.map((user) => (_jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: user.name ?? "—" }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: user.email }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === "ADMIN"
                                                                ? "bg-violet-100 text-violet-700"
                                                                : "bg-gray-100 text-gray-600"}`, children: user.role === "ADMIN" ? "Admin" : "Agent" }) }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: new Date(user.createdAt).toLocaleDateString() }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Button, { variant: "destructive", size: "xs", disabled: deletingId === user.id, onClick: () => handleDelete(user.id), children: deletingId === user.id ? "Deleting…" : "Delete" }) })] }, user.id)))] })] }) }) }))] })] }));
}
