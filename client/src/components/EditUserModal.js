import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role, editUserSchema } from "@repo/core";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "./ui/dialog";
export function EditUserModal({ open, onOpenChange, onSubmit, isPending, error, user }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(editUserSchema),
        values: { name: user.name ?? "", email: user.email, password: "", role: user.role },
    });
    const handleOpenChange = (next) => {
        if (!next)
            reset();
        onOpenChange(next);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: handleOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Edit user" }) }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4 mt-2", autoComplete: "off", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "edit-name", children: "Name" }), _jsx(Input, { id: "edit-name", placeholder: "Jane Doe", "aria-invalid": !!errors.name, ...register("name") }), errors.name && _jsx("p", { className: "text-xs text-destructive", children: errors.name.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "edit-email", children: "Email" }), _jsx(Input, { id: "edit-email", type: "text", autoComplete: "off", placeholder: "jane@example.com", "aria-invalid": !!errors.email, ...register("email") }), errors.email && _jsx("p", { className: "text-xs text-destructive", children: errors.email.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "edit-password", children: "Password" }), _jsx(Input, { id: "edit-password", type: "password", autoComplete: "new-password", "aria-invalid": !!errors.password, ...register("password") }), errors.password && _jsx("p", { className: "text-xs text-destructive", children: errors.password.message }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Leave blank to keep current password" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "edit-role", children: "Role" }), _jsxs("select", { id: "edit-role", className: "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", ...register("role"), children: [_jsx("option", { value: Role.AGENT, children: "Agent" }), _jsx("option", { value: Role.ADMIN, children: "Admin" })] })] }), error && _jsx("p", { className: "text-sm text-destructive", children: error }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => handleOpenChange(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isPending, children: isPending ? "Saving…" : "Save changes" })] })] })] }) }));
}
