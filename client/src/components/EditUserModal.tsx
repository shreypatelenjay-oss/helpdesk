import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role, editUserSchema } from "@repo/core";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type FormValues = z.infer<typeof editUserSchema>;

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  error: string | null;
  user: User;
};

export function EditUserModal({ open, onOpenChange, onSubmit, isPending, error, user }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(editUserSchema),
    values: { name: user.name ?? "", email: user.email, password: "", role: user.role },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2" autoComplete="off">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" placeholder="Jane Doe" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="text" autoComplete="off" placeholder="jane@example.com" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-password">Password</Label>
            <Input id="edit-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-role">Role</Label>
            <select
              id="edit-role"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register("role")}
            >
              <option value={Role.AGENT}>Agent</option>
              <option value={Role.ADMIN}>Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
