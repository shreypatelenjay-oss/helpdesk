import { jsx as _jsx } from "react/jsx-runtime";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { TicketsPage } from "./TicketsPage";
import { renderWithQuery } from "../test/render";
vi.mock("axios");
vi.mock("../components/Navbar", () => ({ Navbar: () => _jsx("nav", {}) }));
const mockedAxios = vi.mocked(axios, true);
const TICKETS = [
    {
        id: "1",
        subject: "Newest ticket",
        senderEmail: "newest@example.com",
        status: "OPEN",
        category: null,
        createdAt: "2024-02-01T00:00:00.000Z",
        agent: null,
    },
    {
        id: "2",
        subject: "Oldest ticket",
        senderEmail: "oldest@example.com",
        status: "RESOLVED",
        category: "REFUND_REQUEST",
        createdAt: "2024-01-01T00:00:00.000Z",
        agent: { id: "u1", name: "Alice", email: "alice@example.com" },
    },
];
beforeEach(() => {
    vi.clearAllMocks();
});
describe("TicketsPage", () => {
    describe("loading state", () => {
        it("renders skeleton rows while fetching", () => {
            mockedAxios.get.mockReturnValue(new Promise(() => { }));
            renderWithQuery(_jsx(TicketsPage, {}));
            expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
            expect(screen.queryByText("Newest ticket")).not.toBeInTheDocument();
        });
    });
    describe("loaded state", () => {
        beforeEach(() => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents")) {
                    return Promise.resolve({ data: [{ id: "u1", name: "Alice", email: "alice@example.com" }] });
                }
                return Promise.resolve({
                    data: {
                        tickets: TICKETS,
                        totalCount: TICKETS.length,
                        totalPages: 1,
                        page: 1,
                        pageSize: 10,
                    },
                });
            });
        });
        it("renders the Tickets heading", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument());
        });
        it("renders all table column headers", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            for (const header of ["Subject", "From", "Status", "Category", "Assigned to", "Created"]) {
                expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
            }
        });
        it("renders a row for each ticket with subject and sender email", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => expect(screen.getByText("Newest ticket")).toBeInTheDocument());
            expect(screen.getByText("newest@example.com")).toBeInTheDocument();
            expect(screen.getByText("Oldest ticket")).toBeInTheDocument();
            expect(screen.getByText("oldest@example.com")).toBeInTheDocument();
        });
        it("displays tickets in the order returned by the API (newest first)", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            const rows = screen.getAllByRole("row");
            // rows[0] is the header; rows[1] is the first data row
            expect(rows[1]).toHaveTextContent("Newest ticket");
            expect(rows[2]).toHaveTextContent("Oldest ticket");
        });
        it("shows an Open badge for OPEN tickets", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
        });
        it("shows a Resolved badge for RESOLVED tickets", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Oldest ticket"));
            expect(screen.getAllByText("Resolved").length).toBeGreaterThan(0);
        });
        it("shows an em dash for tickets with no category", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        });
        it("shows a category badge for tickets with a category", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Oldest ticket"));
            expect(screen.getAllByText("Refund").length).toBeGreaterThan(0);
        });
        it("shows Unassigned for tickets with no agent", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
        });
        it("shows the agent name for assigned tickets", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Oldest ticket"));
            expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
        });
        it("shows empty state when there are no tickets", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents")) {
                    return Promise.resolve({ data: [{ id: "u1", name: "Alice", email: "alice@example.com" }] });
                }
                return Promise.resolve({
                    data: {
                        tickets: [],
                        totalCount: 0,
                        totalPages: 1,
                        page: 1,
                        pageSize: 10,
                    },
                });
            });
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => expect(screen.getByText("No tickets yet.")).toBeInTheDocument());
        });
        it("renders filtering controls", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            expect(screen.getByPlaceholderText("Search subject, body or sender...")).toBeInTheDocument();
            expect(screen.getByRole("combobox", { name: "Filter by Status" })).toBeInTheDocument();
            expect(screen.getByRole("combobox", { name: "Filter by Category" })).toBeInTheDocument();
            expect(screen.getByRole("combobox", { name: "Filter by Assignee" })).toBeInTheDocument();
        });
        it("filters tickets by search query", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            const searchInput = screen.getByPlaceholderText("Search subject, body or sender...");
            fireEvent.change(searchInput, { target: { value: "specific issue" } });
            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", expect.objectContaining({
                    params: expect.objectContaining({ search: "specific issue" })
                }));
            });
        });
        it("filters tickets by status", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            const statusSelect = screen.getByRole("combobox", { name: "Filter by Status" });
            fireEvent.change(statusSelect, { target: { value: "OPEN" } });
            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", expect.objectContaining({
                    params: expect.objectContaining({ status: "OPEN" })
                }));
            });
        });
        it("displays the reset button when a filter is active and clears filters on click", async () => {
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
            const statusSelect = screen.getByRole("combobox", { name: "Filter by Status" });
            fireEvent.change(statusSelect, { target: { value: "CLOSED" } });
            const resetButton = await screen.findByRole("button", { name: /reset/i });
            expect(resetButton).toBeInTheDocument();
            fireEvent.click(resetButton);
            await waitFor(() => {
                expect(statusSelect).toHaveValue("ALL");
                expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
            });
        });
        it("shows filtered empty state when there are no tickets matching filters", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents")) {
                    return Promise.resolve({ data: [] });
                }
                return Promise.resolve({
                    data: {
                        tickets: [],
                        totalCount: 0,
                        totalPages: 1,
                        page: 1,
                        pageSize: 10,
                    },
                });
            });
            renderWithQuery(_jsx(TicketsPage, {}));
            const statusSelect = await screen.findByRole("combobox", { name: "Filter by Status" });
            fireEvent.change(statusSelect, { target: { value: "CLOSED" } });
            await waitFor(() => expect(screen.getByText("No tickets match the selected filters.")).toBeInTheDocument());
        });
        it("renders pagination controls and updates parameters on click", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents")) {
                    return Promise.resolve({ data: [{ id: "u1", name: "Alice", email: "alice@example.com" }] });
                }
                return Promise.resolve({
                    data: {
                        tickets: TICKETS,
                        totalCount: 15,
                        totalPages: 2,
                        page: 1,
                        pageSize: 10,
                    },
                });
            });
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            expect(screen.getByText(/results/i)).toHaveTextContent("Showing 1 to 10 of 15 results");
            const nextBtn = screen.getByRole("button", { name: /Next page/i });
            fireEvent.click(nextBtn);
            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", expect.objectContaining({
                    params: expect.objectContaining({ page: 2, pageSize: 10 })
                }));
            });
        });
        it("resets page to 1 when a filter is changed", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents")) {
                    return Promise.resolve({ data: [] });
                }
                return Promise.resolve({
                    data: {
                        tickets: TICKETS,
                        totalCount: 15,
                        totalPages: 2,
                        page: 2,
                        pageSize: 10,
                    },
                });
            });
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => screen.getByText("Newest ticket"));
            const statusSelect = screen.getByRole("combobox", { name: "Filter by Status" });
            fireEvent.change(statusSelect, { target: { value: "OPEN" } });
            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", expect.objectContaining({
                    params: expect.objectContaining({ page: 1, status: "OPEN" })
                }));
            });
        });
    });
    describe("error state", () => {
        it("shows an error message when the fetch fails", async () => {
            mockedAxios.get.mockRejectedValue(new Error("Network error"));
            mockedAxios.isAxiosError.mockReturnValue(false);
            renderWithQuery(_jsx(TicketsPage, {}));
            await waitFor(() => expect(screen.getByText("Failed to load tickets")).toBeInTheDocument());
        });
    });
});
