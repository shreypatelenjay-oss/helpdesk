import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role, createUserSchema } from "@repo/core";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "./ui/dialog";
export function CreateUserModal({ open, onOpenChange, onSubmit, isPending, error }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(createUserSchema),
        defaultValues: { name: "", email: "", password: "", role: Role.AGENT },
    });
    const handleOpenChange = (next) => {
        if (!next)
            reset();
        onOpenChange(next);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: handleOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "New user" }) }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4 mt-2", autoComplete: "off", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", placeholder: "Jane Doe", "aria-invalid": !!errors.name, ...register("name") }), errors.name && _jsx("p", { className: "text-xs text-destructive", children: errors.name.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "text", autoComplete: "off", placeholder: "jane@example.com", "aria-invalid": !!errors.email, ...register("email") }), errors.email && _jsx("p", { className: "text-xs text-destructive", children: errors.email.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "new-password", "aria-invalid": !!errors.password, ...register("password") }), errors.password && _jsx("p", { className: "text-xs text-destructive", children: errors.password.message })] }), error && _jsx("p", { className: "text-sm text-destructive", children: error }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => handleOpenChange(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isPending, children: isPending ? "Creating…" : "Create user" })] })] })] }) }));
}
