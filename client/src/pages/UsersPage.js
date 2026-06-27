import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Role } from "@repo/core";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { CreateUserModal } from "../components/CreateUserModal";
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
export function UsersPage() {
    const qc = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const { data: users, isPending, error } = useQuery({
        queryKey: ["users"],
        queryFn: () => axios.get("/api/users").then((r) => r.data),
    });
    const createUser = useMutation({
        mutationFn: (body) => axios.post("/api/users", body).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
            setModalOpen(false);
        },
    });
    const deleteUser = useMutation({
        mutationFn: (id) => axios.delete(`/api/users/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
        onError: (e) => alert(axiosError(e, "Failed to delete user")),
    });
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-4xl mx-auto p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Users" }), _jsx(Button, { onClick: () => { createUser.reset(); setModalOpen(true); }, children: "Add user" })] }), _jsx(CreateUserModal, { open: modalOpen, onOpenChange: setModalOpen, onSubmit: (data) => createUser.mutate(data), isPending: createUser.isPending, error: createUser.isError ? axiosError(createUser.error, "Failed to create user") : null }), error && _jsx("p", { className: "text-destructive text-sm", children: axiosError(error, "Failed to load users") }), isPending ? (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3" })] }) }), _jsx("tbody", { children: Array.from({ length: 4 }).map((_, i) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-28" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-40" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-14 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-20" }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Skeleton, { className: "h-6 w-14 ml-auto" }) })] }, i))) })] }) }) })) : users && (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3" })] }) }), _jsxs("tbody", { children: [users.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-6 text-center text-gray-400", children: "No users yet." }) })), users.map((user) => (_jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: user.name ?? "—" }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: user.email }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === Role.ADMIN
                                                                ? "bg-violet-100 text-violet-700"
                                                                : "bg-gray-100 text-gray-600"}`, children: user.role === Role.ADMIN ? "Admin" : "Agent" }) }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: new Date(user.createdAt).toLocaleDateString() }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Button, { variant: "destructive", size: "xs", disabled: deleteUser.isPending && deleteUser.variables === user.id, onClick: () => deleteUser.mutate(user.id), children: deleteUser.isPending && deleteUser.variables === user.id ? "Deleting…" : "Delete" }) })] }, user.id)))] })] }) }) }))] })] }));
}
