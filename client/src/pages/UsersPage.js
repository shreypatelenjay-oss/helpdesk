import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Role } from "@repo/core";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { CreateUserModal } from "../components/CreateUserModal";
import { EditUserModal } from "../components/EditUserModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "../components/ui/alert-dialog";
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
export function UsersPage() {
    const qc = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
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
    const editUser = useMutation({
        mutationFn: (body) => axios.patch(`/api/users/${editTarget.id}`, body).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
            setEditTarget(null);
        },
    });
    const deleteUser = useMutation({
        mutationFn: (id) => axios.delete(`/api/users/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
        onError: (e) => alert(axiosError(e, "Failed to delete user")),
    });
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-4xl mx-auto p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Users" }), _jsx(Button, { onClick: () => { createUser.reset(); setModalOpen(true); }, children: "Add user" })] }), _jsx(CreateUserModal, { open: modalOpen, onOpenChange: setModalOpen, onSubmit: (data) => createUser.mutate(data), isPending: createUser.isPending, error: createUser.isError ? axiosError(createUser.error, "Failed to create user") : null }), editTarget && (_jsx(EditUserModal, { open: true, onOpenChange: (open) => { if (!open) {
                            setEditTarget(null);
                            editUser.reset();
                        } }, onSubmit: (data) => editUser.mutate(data), isPending: editUser.isPending, error: editUser.isError ? axiosError(editUser.error, "Failed to update user") : null, user: editTarget })), _jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => { if (!open)
                            setDeleteTarget(null); }, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { children: ["Delete ", deleteTarget?.name ?? deleteTarget?.email, "?"] }), _jsx(AlertDialogDescription, { children: "This action cannot be undone. The user will no longer be able to sign in." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { className: "bg-destructive text-white hover:bg-destructive/90", onClick: () => { deleteUser.mutate(deleteTarget.id); setDeleteTarget(null); }, children: "Delete" })] })] }) }), error && _jsx("p", { className: "text-destructive text-sm", children: axiosError(error, "Failed to load users") }), isPending ? (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3 font-medium w-20", children: "Actions" })] }) }), _jsx("tbody", { children: Array.from({ length: 4 }).map((_, i) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-28" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-40" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-14 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-20" }) }), _jsx("td", { className: "px-4 py-3 w-20", children: _jsx(Skeleton, { className: "h-6 w-14" }) })] }, i))) })] }) }) })) : users && (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" }), _jsx("th", { className: "px-4 py-3 font-medium w-20", children: "Actions" })] }) }), _jsxs("tbody", { children: [users.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-6 text-center text-gray-400", children: "No users yet." }) })), users.map((user) => (_jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: user.name ?? "—" }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: user.email }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === Role.ADMIN
                                                                ? "bg-violet-100 text-violet-700"
                                                                : "bg-gray-100 text-gray-600"}`, children: user.role === Role.ADMIN ? "Admin" : "Agent" }) }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: new Date(user.createdAt).toLocaleDateString() }), _jsx("td", { className: "px-4 py-3 w-20", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "xs", "aria-label": "Edit user", onClick: () => { editUser.reset(); setEditTarget(user); }, children: _jsx(PencilIcon, { className: "size-3.5" }) }), user.role !== Role.ADMIN && (_jsx(Button, { variant: "ghost", size: "xs", "aria-label": "Delete user", className: "text-destructive hover:text-destructive hover:bg-destructive/10", disabled: deleteUser.isPending && deleteUser.variables === user.id, onClick: () => setDeleteTarget(user), children: _jsx(Trash2Icon, { className: "size-3.5" }) }))] }) })] }, user.id)))] })] }) }) }))] })] }));
}
