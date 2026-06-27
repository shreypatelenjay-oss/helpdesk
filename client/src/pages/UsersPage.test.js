import { jsx as _jsx } from "react/jsx-runtime";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { Role } from "@repo/core";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "../test/render";
vi.mock("axios");
vi.mock("../components/Navbar", () => ({ Navbar: () => _jsx("nav", {}) }));
const mockedAxios = vi.mocked(axios, true);
const USERS = [
    { id: "1", name: "Alice Admin", email: "alice@example.com", role: Role.ADMIN, createdAt: "2024-01-01T00:00:00.000Z" },
    { id: "2", name: null, email: "bob@example.com", role: Role.AGENT, createdAt: "2024-02-01T00:00:00.000Z" },
];
beforeEach(() => {
    vi.clearAllMocks();
});
describe("UsersPage", () => {
    describe("loading state", () => {
        it("renders skeleton rows while fetching", () => {
            mockedAxios.get.mockReturnValue(new Promise(() => { })); // never resolves
            renderWithQuery(_jsx(UsersPage, {}));
            expect(screen.getAllByRole("row").length).toBeGreaterThan(1); // header + 4 skeleton rows
            expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
        });
    });
    describe("loaded state", () => {
        beforeEach(() => {
            mockedAxios.get.mockResolvedValue({ data: USERS });
        });
        it("renders a row for each user", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
            expect(screen.getByText("bob@example.com")).toBeInTheDocument();
        });
        it("shows — for users with no name", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            expect(screen.getByText("—")).toBeInTheDocument();
        });
        it("displays the correct role badge for each user", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            expect(screen.getByText("Admin")).toBeInTheDocument();
            expect(screen.getByText("Agent")).toBeInTheDocument();
        });
        it("shows empty state when list is empty", async () => {
            mockedAxios.get.mockResolvedValue({ data: [] });
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => expect(screen.getByText("No users yet.")).toBeInTheDocument());
        });
    });
    describe("error state", () => {
        it("shows an error message when the fetch fails", async () => {
            mockedAxios.get.mockRejectedValue(new Error("Network error"));
            mockedAxios.isAxiosError.mockReturnValue(false);
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => expect(screen.getByText("Failed to load users")).toBeInTheDocument());
        });
    });
    describe("create user form", () => {
        beforeEach(() => {
            mockedAxios.get.mockResolvedValue({ data: USERS });
        });
        it("is hidden by default", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            expect(screen.queryByText("New user")).not.toBeInTheDocument();
        });
        it("opens when the Add user button is clicked", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            await userEvent.click(screen.getByRole("button", { name: "Add user" }));
            expect(screen.getByText("New user")).toBeInTheDocument();
        });
        it("closes when the Cancel button is clicked", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            await userEvent.click(screen.getByRole("button", { name: "Add user" }));
            await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
            expect(screen.queryByText("New user")).not.toBeInTheDocument();
        });
        it("closes when Escape is pressed", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            await userEvent.click(screen.getByRole("button", { name: "Add user" }));
            expect(screen.getByText("New user")).toBeInTheDocument();
            await userEvent.keyboard("{Escape}");
            await waitFor(() => expect(screen.queryByText("New user")).not.toBeInTheDocument());
        });
        it("closes when clicking outside the dialog", async () => {
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            await userEvent.click(screen.getByRole("button", { name: "Add user" }));
            expect(screen.getByText("New user")).toBeInTheDocument();
            await userEvent.click(document.body);
            await waitFor(() => expect(screen.queryByText("New user")).not.toBeInTheDocument());
        });
        it("submits the form and closes it on success", async () => {
            const newUser = { id: "3", name: "Carol", email: "carol@example.com", role: Role.AGENT, createdAt: "2024-03-01T00:00:00.000Z" };
            mockedAxios.post.mockResolvedValue({ data: newUser });
            mockedAxios.get.mockResolvedValue({ data: [...USERS, newUser] });
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            await userEvent.click(screen.getByRole("button", { name: "Add user" }));
            await userEvent.type(screen.getByLabelText(/name/i), "Carol");
            await userEvent.type(screen.getByLabelText(/email/i), "carol@example.com");
            await userEvent.type(screen.getByLabelText(/password/i), "secret123");
            await userEvent.click(screen.getByRole("button", { name: "Create user" }));
            await waitFor(() => expect(screen.queryByText("New user")).not.toBeInTheDocument());
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/users", expect.objectContaining({ email: "carol@example.com" }));
        });
        it("shows a server error message when creation fails", async () => {
            const err = Object.assign(new Error("Email already in use"), {
                response: { data: { error: "Email already in use" } },
            });
            mockedAxios.post.mockRejectedValue(err);
            mockedAxios.isAxiosError.mockReturnValue(true);
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("Alice Admin"));
            await userEvent.click(screen.getByRole("button", { name: "Add user" }));
            await userEvent.type(screen.getByLabelText(/name/i), "Alice");
            await userEvent.type(screen.getByLabelText(/email/i), "alice@example.com");
            await userEvent.type(screen.getByLabelText(/password/i), "secret123");
            await userEvent.click(screen.getByRole("button", { name: "Create user" }));
            await waitFor(() => expect(screen.getByText("Email already in use")).toBeInTheDocument());
        });
    });
    describe("delete user", () => {
        beforeEach(() => {
            mockedAxios.get.mockResolvedValue({ data: USERS });
        });
        it("calls DELETE and refetches on success", async () => {
            mockedAxios.delete.mockResolvedValue({});
            mockedAxios.get
                .mockResolvedValueOnce({ data: USERS })
                .mockResolvedValueOnce({ data: [USERS[0]] });
            renderWithQuery(_jsx(UsersPage, {}));
            await waitFor(() => screen.getByText("bob@example.com"));
            // Bob is AGENT so his row has the Delete user button; Alice is ADMIN and does not
            const bobRow = screen.getByText("bob@example.com").closest("tr");
            await userEvent.click(within(bobRow).getByRole("button", { name: "Delete user" }));
            // confirm in the alert dialog
            await userEvent.click(screen.getByRole("button", { name: "Delete" }));
            expect(mockedAxios.delete).toHaveBeenCalledWith("/api/users/2");
            await waitFor(() => expect(screen.queryByText("bob@example.com")).not.toBeInTheDocument());
        });
    });
});
describe("edit user", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedAxios.get.mockResolvedValue({ data: USERS });
    });
    it("shows an Edit user button for each user row", async () => {
        renderWithQuery(_jsx(UsersPage, {}));
        // wait for data to load before querying action buttons
        await waitFor(() => expect(screen.getAllByRole("button", { name: "Edit user" })).toHaveLength(2));
    });
    it("clicking Edit opens the modal pre-filled with the user's name", async () => {
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const aliceRow = screen.getByText("Alice Admin").closest("tr");
        await userEvent.click(within(aliceRow).getByRole("button", { name: "Edit user" }));
        expect(screen.getByRole("dialog", { name: "Edit user" })).toBeInTheDocument();
        expect(screen.getByLabelText("Name")).toHaveValue("Alice Admin");
    });
    it("submits the patch and closes the modal on success", async () => {
        mockedAxios.patch.mockResolvedValue({ data: { ...USERS[0], name: "Alice Updated" } });
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const aliceRow = screen.getByText("Alice Admin").closest("tr");
        await userEvent.click(within(aliceRow).getByRole("button", { name: "Edit user" }));
        const nameInput = screen.getByLabelText("Name");
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Alice Updated");
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit user" })).not.toBeInTheDocument());
        expect(mockedAxios.patch).toHaveBeenCalledWith("/api/users/1", expect.objectContaining({ name: "Alice Updated" }));
    });
    it("shows an error message inside the modal when the server rejects the edit", async () => {
        const err = Object.assign(new Error("Email already in use"), {
            response: { data: { error: "Email already in use" } },
        });
        mockedAxios.patch.mockRejectedValue(err);
        mockedAxios.isAxiosError.mockReturnValue(true);
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const aliceRow = screen.getByText("Alice Admin").closest("tr");
        await userEvent.click(within(aliceRow).getByRole("button", { name: "Edit user" }));
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(screen.getByRole("dialog", { name: "Edit user" })).toContainElement(screen.getByText("Email already in use")));
    });
});
describe("delete user - confirmation dialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedAxios.get.mockResolvedValue({ data: USERS });
    });
    it("does not show a Delete user button for admin users", async () => {
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const aliceRow = screen.getByText("Alice Admin").closest("tr");
        expect(within(aliceRow).queryByRole("button", { name: "Delete user" })).not.toBeInTheDocument();
    });
    it("shows a Delete user button for agent users", async () => {
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const bobRow = screen.getByText("bob@example.com").closest("tr");
        expect(within(bobRow).getByRole("button", { name: "Delete user" })).toBeInTheDocument();
    });
    it("clicking Delete opens the confirmation dialog", async () => {
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const bobRow = screen.getByText("bob@example.com").closest("tr");
        await userEvent.click(within(bobRow).getByRole("button", { name: "Delete user" }));
        // Bob has no name so the title uses his email; scope text check to the dialog to avoid matching the table cell
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText(/bob@example\.com/)).toBeInTheDocument();
        expect(within(dialog).getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });
    it("confirming deletion calls axios.delete and refetches the list", async () => {
        mockedAxios.delete.mockResolvedValue({});
        mockedAxios.get
            .mockResolvedValueOnce({ data: USERS })
            .mockResolvedValueOnce({ data: [USERS[0]] });
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const bobRow = screen.getByText("bob@example.com").closest("tr");
        await userEvent.click(within(bobRow).getByRole("button", { name: "Delete user" }));
        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(mockedAxios.delete).toHaveBeenCalledWith("/api/users/2");
        await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2));
    });
    it("cancelling the dialog does not call axios.delete", async () => {
        renderWithQuery(_jsx(UsersPage, {}));
        await waitFor(() => screen.getByText("Alice Admin"));
        const bobRow = screen.getByText("bob@example.com").closest("tr");
        await userEvent.click(within(bobRow).getByRole("button", { name: "Delete user" }));
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockedAxios.delete).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });
});
