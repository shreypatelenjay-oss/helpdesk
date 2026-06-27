import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { CreateUserModal } from "./CreateUserModal";
import { renderWithQuery } from "../test/render";

vi.mock("axios");
vi.mocked(axios, true);

function renderModal(props: Partial<Parameters<typeof CreateUserModal>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
    error: null,
  };
  return renderWithQuery(<CreateUserModal {...defaults} {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateUserModal", () => {
  describe("visibility", () => {
    it("renders nothing when open=false", () => {
      renderModal({ open: false });
      expect(screen.queryByText("New user")).not.toBeInTheDocument();
    });

    it("renders the dialog with all 3 fields when open=true", () => {
      renderModal();
      expect(screen.getByText("New user")).toBeInTheDocument();
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows all 3 error messages when the form is submitted empty", async () => {
      const onSubmit = vi.fn();
      renderModal({ onSubmit });
      await userEvent.click(screen.getByRole("button", { name: "Create user" }));
      expect(await screen.findAllByText(/./)).toBeTruthy();
      // name, email, and password errors should all be present
      expect(screen.getByLabelText(/^name$/i)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows name error when name is shorter than 3 chars", async () => {
      const onSubmit = vi.fn();
      renderModal({ onSubmit });
      await userEvent.type(screen.getByLabelText(/^name$/i), "Ab");
      await userEvent.type(screen.getByLabelText(/^email$/i), "valid@example.com");
      await userEvent.type(screen.getByLabelText(/^password$/i), "validpassword");
      await userEvent.click(screen.getByRole("button", { name: "Create user" }));
      expect(await screen.findByText(/name/i, { selector: "p" })).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows email error when email format is invalid", async () => {
      const onSubmit = vi.fn();
      renderModal({ onSubmit });
      await userEvent.type(screen.getByLabelText(/^name$/i), "Jane Doe");
      await userEvent.type(screen.getByLabelText(/^email$/i), "not-an-email");
      await userEvent.type(screen.getByLabelText(/^password$/i), "validpassword");
      await userEvent.click(screen.getByRole("button", { name: "Create user" }));
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows password error when password is shorter than 8 chars", async () => {
      const onSubmit = vi.fn();
      renderModal({ onSubmit });
      await userEvent.type(screen.getByLabelText(/^name$/i), "Jane Doe");
      await userEvent.type(screen.getByLabelText(/^email$/i), "jane@example.com");
      await userEvent.type(screen.getByLabelText(/^password$/i), "short");
      await userEvent.click(screen.getByRole("button", { name: "Create user" }));
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("sets aria-invalid on each field after a failed submit attempt", async () => {
      renderModal();
      await userEvent.click(screen.getByRole("button", { name: "Create user" }));
      // Wait for validation to run
      await screen.findByRole("button", { name: "Create user" });
      expect(screen.getByLabelText(/^name$/i)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("valid submission", () => {
    it("calls onSubmit with correct data when all fields are valid", async () => {
      const onSubmit = vi.fn();
      renderModal({ onSubmit });
      await userEvent.type(screen.getByLabelText(/^name$/i), "Jane Doe");
      await userEvent.type(screen.getByLabelText(/^email$/i), "jane@example.com");
      await userEvent.type(screen.getByLabelText(/^password$/i), "securepassword");
      await userEvent.click(screen.getByRole("button", { name: "Create user" }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Jane Doe",
          email: "jane@example.com",
          password: "securepassword",
        }),
        expect.anything(),
      );
    });
  });

  describe("isPending state", () => {
    it("disables the Create user button and shows 'Creating…' when isPending=true", () => {
      renderModal({ isPending: true });
      const btn = screen.getByRole("button", { name: "Creating…" });
      expect(btn).toBeDisabled();
    });
  });

  describe("error prop", () => {
    it("displays the server error string when error is provided", () => {
      renderModal({ error: "Email already in use" });
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
  });

  describe("cancel button", () => {
    it("calls onOpenChange(false) when Cancel is clicked", async () => {
      const onOpenChange = vi.fn();
      renderModal({ onOpenChange });
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
