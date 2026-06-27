import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "../test/render";

vi.mock("axios");
vi.mock("../components/Navbar", () => ({ Navbar: () => <nav /> }));

const mockedAxios = vi.mocked(axios, true);

const USERS = [
  { id: "1", name: "Alice Admin", email: "alice@example.com", role: "ADMIN", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "2", name: null,          email: "bob@example.com",   role: "AGENT", createdAt: "2024-02-01T00:00:00.000Z" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage", () => {
  describe("loading state", () => {
    it("renders skeleton rows while fetching", () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {})); // never resolves
      renderWithQuery(<UsersPage />);
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1); // header + 4 skeleton rows
      expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
    });
  });

  describe("loaded state", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: USERS });
    });

    it("renders a row for each user", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });

    it("shows — for users with no name", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));
      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("displays the correct role badge for each user", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Agent")).toBeInTheDocument();
    });

    it("shows empty state when list is empty", async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("No users yet.")).toBeInTheDocument());
    });
  });

  describe("error state", () => {
    it("shows an error message when the fetch fails", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));
      mockedAxios.isAxiosError.mockReturnValue(false);
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("Failed to load users")).toBeInTheDocument());
    });
  });

  describe("create user form", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: USERS });
    });

    it("is hidden by default", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));
      expect(screen.queryByText("New user")).not.toBeInTheDocument();
    });

    it("opens when the Add user button is clicked", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));

      await userEvent.click(screen.getByRole("button", { name: "Add user" }));
      expect(screen.getByText("New user")).toBeInTheDocument();
    });

    it("closes when the Cancel button is clicked", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));

      await userEvent.click(screen.getByRole("button", { name: "Add user" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByText("New user")).not.toBeInTheDocument();
    });

    it("closes when Escape is pressed", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));

      await userEvent.click(screen.getByRole("button", { name: "Add user" }));
      expect(screen.getByText("New user")).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByText("New user")).not.toBeInTheDocument());
    });

    it("closes when clicking outside the dialog", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));

      await userEvent.click(screen.getByRole("button", { name: "Add user" }));
      expect(screen.getByText("New user")).toBeInTheDocument();

      await userEvent.click(document.body);
      await waitFor(() => expect(screen.queryByText("New user")).not.toBeInTheDocument());
    });

    it("submits the form and closes it on success", async () => {
      const newUser = { id: "3", name: "Carol", email: "carol@example.com", role: "AGENT", createdAt: "2024-03-01T00:00:00.000Z" };
      mockedAxios.post.mockResolvedValue({ data: newUser });
      mockedAxios.get.mockResolvedValue({ data: [...USERS, newUser] });

      renderWithQuery(<UsersPage />);
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

      renderWithQuery(<UsersPage />);
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
        .mockResolvedValueOnce({ data: [USERS[1]] });

      renderWithQuery(<UsersPage />);
      await waitFor(() => screen.getByText("Alice Admin"));

      const aliceRow = screen.getByText("Alice Admin").closest("tr")!;
      await userEvent.click(within(aliceRow).getByRole("button", { name: "Delete" }));

      expect(mockedAxios.delete).toHaveBeenCalledWith("/api/users/1");
      await waitFor(() => expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument());
    });
  });
});
