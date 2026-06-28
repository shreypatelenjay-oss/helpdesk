import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "../lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});
export function LoginPage() {
    const { data: session, isPending } = authClient.useSession();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({ resolver: zodResolver(schema) });
    if (isPending)
        return null;
    if (session)
        return _jsx(Navigate, { to: "/", replace: true });
    const onSubmit = async (values) => {
        setServerError(null);
        const { error } = await authClient.signIn.email(values);
        if (error) {
            setServerError(error.message ?? "Sign in failed");
            return;
        }
        navigate("/", { replace: true });
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-muted/40", children: _jsxs(Card, { className: "w-full max-w-sm", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Sign in" }), _jsx(CardDescription, { children: "Enter your credentials to continue" })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [serverError && (_jsx(Alert, { variant: "destructive", children: _jsx(AlertDescription, { children: serverError }) })), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "text", placeholder: "you@example.com", "aria-invalid": !!errors.email, ...register("email") }), errors.email && (_jsx("p", { className: "text-destructive text-xs", children: errors.email.message }))] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", "aria-invalid": !!errors.password, ...register("password") }), errors.password && (_jsx("p", { className: "text-destructive text-xs", children: errors.password.message }))] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? "Signing in…" : "Sign in" })] }) })] }) }));
}
